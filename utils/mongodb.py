# This code is part of Tergite
#
# (C) Copyright Martin Ahindura 2024
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import pymongo
from motor.motor_asyncio import (
    AsyncIOMotorClient,
    AsyncIOMotorCollection,
    AsyncIOMotorDatabase,
)

from .date_time import get_current_timestamp

# settings
LATEST_FIRST_SORT = {
    "key_or_list": "timelog.REGISTERED",
    "direction": pymongo.DESCENDING,
}


_CONNECTIONS = {}


def get_mongodb(url: str, name: str) -> AsyncIOMotorDatabase:
    """Returns a mongo db which can be used to get collections

    Args:
        url: the mongo db url
        name: the name of the mongo database

    Returns:
        a AsyncIOMotorDatabase instance that can be used to extract collections
    """
    global _CONNECTIONS

    try:
        client = _CONNECTIONS[url]
        if client.io_loop.is_closed():
            client.close()
            logging.debug(f"New mongo db connection at {datetime.utcnow().isoformat()}")
            client = AsyncIOMotorClient(url, tz_aware=True)
    except KeyError:
        logging.debug(f"New mongo db connection at {datetime.utcnow().isoformat()}")
        client = AsyncIOMotorClient(url, tz_aware=True)

    _CONNECTIONS[url] = client
    return client[name]


class DocumentNotFoundError(BaseException):
    def __init__(self, msg: str):
        self.__msg = msg

    def __repr__(self):
        return f"DocumentNotFoundError: {self.__msg}"

    def __str__(self):
        return self.__msg


async def find_one(
    collection: AsyncIOMotorCollection,
    _filter: Dict[str, Any],
    dropped_fields: Tuple[str, ...] = ("_id",),
    sorted_by: Optional[List[Tuple[str, int]]] = None,
) -> Dict[str, Any]:
    """Finds first record in the given collection that matches the given _filter

    Args:
        collection: the mongodb collection to find the record
        _filter: the object which the returned record should match against
        dropped_fields: fields to be dropped from the returned record
        sorted_by: List of (field, sort-direction) tuples to use in sorting

    Returns:
        a dict representing the given record

    Raises:
        DocumentNotFoundError: no documents matching the filter '{_filter}' were found in the '{collection}' collection
    """
    projection = {k: False for k in dropped_fields}
    kwargs = dict(projection=projection, filter=_filter)

    if sorted_by:
        kwargs["sort"] = sorted_by

    document = await collection.find_one(**kwargs)
    if document is None:
        raise DocumentNotFoundError(
            f"no documents matching the filter '{_filter}' were found in the '{collection}' collection"
        )
    else:
        return document


async def find_all(
    collection: AsyncIOMotorCollection, /, *, limit: int = 10, **order
) -> List[Dict[str, Any]]:
    """Retrieves all records in the collection up to limit records, given the sort order

    Args:
        collection: the mongo db collection to query from
        limit: the maximum number of records to return
        order: the key-value args where key is name of field and value is -1 or 1,
            implying descending and ascending respectively

    Returns:
        a list of documents that were found
    """
    db_cursor = collection.find({}, {"_id": 0})
    if order:
        db_cursor.sort(**order)
    if limit >= 0:
        db_cursor.limit(limit)

    response = []
    async for backend in db_cursor:
        response.append(backend)

    return response


def get_time_logged_documents(original: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Adds a timelog to each of the documents that are passed

    Args:
        original: the list of dicts to add a timelog to

    Returns:
        a list of documents with a timelog of current timestamp
    """
    current_timelog = _get_current_timelog()
    return [{**document, **current_timelog} for document in original]


async def insert_many(
    collection: AsyncIOMotorCollection, documents: List[Dict[str, Any]]
):
    """Inserts many documents into the given collection

    Args:
        collection: the mongo AsyncIOMotorCollection to insert the documents into
        documents: the list of dictionaries to insert into the collection

    Returns:
        the inserted documents

    Raises:
        ValueError: server failed insertion of the documents
    """
    time_logged_documents = get_time_logged_documents(documents)
    result = await collection.insert_many(time_logged_documents, ordered=True)

    if result.acknowledged and len(result.inserted_ids) == len(time_logged_documents):
        for i, _id in enumerate(result.inserted_ids):
            time_logged_documents[i]["_id"] = str(_id)

        return time_logged_documents

    raise ValueError("server failed insertion of the documents")


async def insert_one(collection: AsyncIOMotorCollection, document: Dict[str, Any]):
    """Inserts one document into the given collection

    Args:
        collection: the mongo AsyncIOMotorCollection to insert the documents into
        document: the dictionary to insert into the collection

    Returns:
        the inserted document

    Raises:
        ValueError: server failed to insert document
    """
    current_timelog = _get_current_timelog()
    time_logged_document = {**document, **current_timelog}

    result = await collection.insert_one(time_logged_document)
    if result.acknowledged:
        time_logged_document["_id"] = str(result.inserted_id)
        return time_logged_document

    raise ValueError("server failed to insert document")


async def insert_one_if_not_exists(
    collection: AsyncIOMotorCollection,
    document: Dict[str, Any],
    unique_fields: Tuple[str, ...] = (),
) -> Dict[str, Any]:
    """Inserts a given document in the given collection if it does not exist

    Args:
        collection: the mongo AsyncIOMotorCollection to insert the documents into
        document: the dictionary to insert into the collection
        unique_fields: the tuple of properties that constitute a composite primary key

    Returns:
        the inserted document

    Raises:
        ValueError: server failed to replace or insert document
    """
    _filter = _extract_filter_obj(document=document, unique_fields=unique_fields)
    doc_exists = await collection.count_documents(_filter, limit=1) == 1

    if not doc_exists:
        return await insert_one(collection=collection, document=document)


async def update_many(
    collection: AsyncIOMotorCollection,
    _filter: dict,
    payload: Dict[str, Any],
):
    """Updates many documents in the given collection for the given filter

    Args:
        collection: the mongo AsyncIOMotorCollection to insert the documents into
        _filter: the filter for the documents
        payload: the partial dict to update the documents

    Returns:
        the number of documents that were modified

    Raises:
        ValueError: server failed updating documents
        DocumentNotFoundError: no documents matching {filter} were found
    """
    update = {"$set": {**payload, "timelog.LAST_UPDATED": get_current_timestamp()}}
    result = await collection.update_many(filter=_filter, update=update)

    if not result.acknowledged:
        raise ValueError("server failed updating documents")

    if result.matched_count == 0:
        raise DocumentNotFoundError(f"no documents matching {_filter} were found")

    return result.modified_count


def _get_current_timelog():
    """Gets the dict of the current timelog"""
    return {"timelog": {"REGISTERED": get_current_timestamp()}}


def _extract_filter_obj(document: Dict[str, Any], unique_fields: Tuple[str, ...]):
    """Extracts a filter object from a document, given a set of unique fields

    Args:
        document: the dict from which to construct the filter object
        unique_fields: a tuple of fields that together constitute a unique composite key for the document

    Returns:
        a dict that can be used to find the given document within a mongodb collection

    Raises:
        ValueError: property '{unique_field_name}' is required
    """
    try:
        return {k: document[k] for k in unique_fields}
    except KeyError as exp:
        raise ValueError(f"property '{exp}' is required")
