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
from typing import Any, Dict, List, Mapping, Optional, Tuple

import pymongo
from motor.motor_asyncio import (
    AsyncIOMotorClient,
    AsyncIOMotorCollection,
    AsyncIOMotorDatabase,
)
from pymongo import ReturnDocument

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


async def find(
    collection: AsyncIOMotorCollection,
    filters: Optional[dict] = None,
    exclude: Tuple[str] = (),
    limit: int = 10,
    sorted_by: Optional[List[Tuple[str, int]]] = None,
) -> List[Dict[str, Any]]:
    """Retrieves all records in the collection up to limit records, given the sort order

    Args:
        collection: the mongo db collection to query from
        filters: the mongodb like filters which all returned records should satisfy
        exclude: the fields to exclude
        limit: the maximum number of records to return: If limit is negative, all results are returned
        sorted_by: List of (field, sort-direction) tuples to use in sorting

    Returns:
        a list of documents that were found
    """
    projection = {field: 0 for field in exclude}

    if filters is None:
        filters = {}

    db_cursor = collection.find(filters, projection)
    if sorted_by:
        db_cursor.sort(sorted_by)
    if limit >= 0:
        db_cursor.limit(limit)

    response = []
    async for backend in db_cursor:
        response.append(backend)

    return response


def get_time_logged_documents(
    original: List[Dict[str, Any]], timestamp_path: Tuple[str, ...]
) -> List[Dict[str, Any]]:
    """Adds a timelog to each of the documents that are passed

    Args:
        original: the list of dicts to add a timelog to
        timestamp_path: the path to the timestamp value with nested fields defined by a tuple e.g.
            ("timelog", "REGISTERED") transforms to {"timelog": {"REGISTERED": get_current_timestamp()}}

    Returns:
        a list of documents with a timelog of current timestamp
    """
    current_timestamp_dict = _get_current_timestamp_dict(timestamp_path=timestamp_path)
    return [{**document, **current_timestamp_dict} for document in original]


async def insert_many(
    collection: AsyncIOMotorCollection,
    documents: List[Dict[str, Any]],
    timestamp_path: Tuple[str, ...] = ("timelog", "REGISTERED"),
):
    """Inserts many documents into the given collection

    Args:
        collection: the mongo AsyncIOMotorCollection to insert the documents into
        documents: the list of dictionaries to insert into the collection
        timestamp_path: the path to the timestamp value with nested fields defined by a tuple e.g.
            ("timelog", "REGISTERED") transforms to {"timelog": {"REGISTERED": get_current_timestamp()}};
            default: ("timelog", "REGISTERED")

    Returns:
        the inserted documents

    Raises:
        ValueError: server failed insertion of the documents
    """
    timestamped_documents = get_time_logged_documents(
        documents, timestamp_path=timestamp_path
    )
    result = await collection.insert_many(timestamped_documents, ordered=True)

    if result.acknowledged and len(result.inserted_ids) == len(timestamped_documents):
        for i, _id in enumerate(result.inserted_ids):
            timestamped_documents[i]["_id"] = str(_id)

        return timestamped_documents

    raise ValueError("server failed insertion of the documents")


async def insert_one(
    collection: AsyncIOMotorCollection,
    document: Dict[str, Any],
    timestamp_path: Tuple[str, ...] = ("timelog", "REGISTERED"),
):
    """Inserts one document into the given collection

    Args:
        collection: the mongo AsyncIOMotorCollection to insert the documents into
        document: the dictionary to insert into the collection
        timestamp_path: the path to the timestamp value with nested fields defined by a tuple e.g.
            ("timelog", "REGISTERED") transforms to {"timelog": {"REGISTERED": get_current_timestamp()}};
            default: ("timelog", "REGISTERED")

    Returns:
        the inserted document

    Raises:
        ValueError: server failed to insert document
    """
    current_timestamp_dict = _get_current_timestamp_dict(timestamp_path=timestamp_path)
    timestamped_document = {**document, **current_timestamp_dict}

    result = await collection.insert_one(timestamped_document)
    if result.acknowledged:
        timestamped_document["_id"] = str(result.inserted_id)
        return timestamped_document

    raise ValueError("server failed to insert document")


async def insert_one_if_not_exists(
    collection: AsyncIOMotorCollection,
    document: Dict[str, Any],
    unique_fields: Tuple[str, ...] = (),
    timestamp_path: Tuple[str, ...] = ("timelog", "REGISTERED"),
) -> Dict[str, Any]:
    """Inserts a given document in the given collection if it does not exist

    Args:
        collection: the mongo AsyncIOMotorCollection to insert the documents into
        document: the dictionary to insert into the collection
        unique_fields: the tuple of properties that constitute a composite primary key
        timestamp_path: the path to the timestamp value with nested fields defined by a tuple e.g.
            ("timelog", "REGISTERED") transforms to {"timelog": {"REGISTERED": get_current_timestamp()}};
            default: ("timelog", "REGISTERED")

    Returns:
        the inserted document

    Raises:
        ValueError: server failed to replace or insert document
    """
    _filter = _extract_filter_obj(document=document, unique_fields=unique_fields)
    doc_exists = await collection.count_documents(_filter, limit=1) == 1

    if not doc_exists:
        return await insert_one(
            collection=collection, document=document, timestamp_path=timestamp_path
        )


async def update_many(
    collection: AsyncIOMotorCollection,
    _filter: dict,
    payload: Dict[str, Any],
    timestamp_path: Tuple[str, ...] = ("timelog.LAST_UPDATED",),
):
    """Updates many documents in the given collection for the given filter

    Args:
        collection: the mongo AsyncIOMotorCollection to insert the documents into
        _filter: the filter for the documents
        payload: the partial dict to update the documents
        timestamp_path: the path to the timestamp value with nested fields defined by a tuple e.g.
            ("timelog", "REGISTERED") transforms to {"timelog": {"REGISTERED": get_current_timestamp()}};
            default: ("timelog.LAST_UPDATED",)

    Returns:
        the number of documents that were modified

    Raises:
        ValueError: server failed updating documents
        DocumentNotFoundError: no documents matching {filter} were found
    """
    current_timestamp_dict = _get_current_timestamp_dict(timestamp_path=timestamp_path)
    update = {"$set": {**payload, **current_timestamp_dict}}
    result = await collection.update_many(filter=_filter, update=update)

    if not result.acknowledged:
        raise ValueError("server failed updating documents")

    if result.matched_count == 0:
        raise DocumentNotFoundError(f"no documents matching {_filter} were found")

    return result.modified_count


async def update_one(
    collection: AsyncIOMotorCollection,
    _filter: dict,
    payload: Dict[str, Any],
    return_document: bool = ReturnDocument.BEFORE,
    timestamp_path: Tuple[str, ...] = ("timelog.LAST_UPDATED",),
    upsert: bool = False,
) -> Mapping[str, Any]:
    """Updates one document in the given collection for the given filter

    Args:
        collection: the mongo AsyncIOMotorCollection to insert the documents into
        _filter: the filter for the documents
        payload: the partial dict to update the documents
        return_document:  If ReturnDocument.BEFORE (the default), returns the original document before it was updated.
            If ReturnDocument.AFTER, returns the updated or inserted document.
        timestamp_path: the path to the timestamp value with nested fields defined by a tuple e.g.
            ("timelog", "REGISTERED") transforms to {"timelog": {"REGISTERED": get_current_timestamp()}};
            default: ("timelog.LAST_UPDATED",)
        upsert: whether we should insert the document if it does not exist

    Returns:
        either the modified document or the original document

    Raises:
        DocumentNotFoundError: no documents matching {filter} were found
    """
    current_timestamp_dict = _get_current_timestamp_dict(timestamp_path=timestamp_path)
    update = {"$set": {**payload, **current_timestamp_dict}}
    result = await collection.find_one_and_update(
        filter=_filter,
        update=update,
        return_document=return_document,
        upsert=upsert,
    )

    if result is None:
        raise DocumentNotFoundError(f"no documents matching {_filter} were found")

    return result


def _get_current_timestamp_dict(timestamp_path: Tuple[str, ...]):
    """Gets the dict of the current timelog

    Args:
        timestamp_path: the path to the timestamp value with nested fields defined by a tuple e.g.
            ("timelog", "REGISTERED") transforms to {"timelog": {"REGISTERED": get_current_timestamp()}}

    Returns:
        A dictionary containing only the timestamp field set to the current timestamp
    """
    timestamp_dict = {timestamp_path[-1]: get_current_timestamp()}
    for k in reversed(timestamp_path[:-1]):
        timestamp_dict = {k: {**timestamp_dict}}

    return timestamp_dict


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
