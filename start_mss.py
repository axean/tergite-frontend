"""A simpler start script using python instead of bash"""
from dotenv import load_dotenv

load_dotenv()


if __name__ == "__main__":
    import uvicorn

    from settings import APP_SETTINGS, MSS_PORT

    uvicorn.run(
        "rest_api:app",
        host="0.0.0.0",
        port=MSS_PORT,
        proxy_headers=True,
        reload=APP_SETTINGS == "development",
    )
