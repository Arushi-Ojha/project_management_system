import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load your connection string
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "project_management_system")

async def truncate_database():
    print(f"Connecting to {DB_NAME}...")
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    
    # Get a list of all active collections
    collections = await db.list_collection_names()
    
    if not collections:
        print("Database is already empty.")
        return

    # Drop each collection one by one
    for coll in collections:
        await db[coll].drop()
        print(f"Emptied collection: {coll}")
        
    print("\nDatabase completely truncated! Ready for fresh testing.")

if __name__ == "__main__":
    # Run the async truncation
    asyncio.run(truncate_database())