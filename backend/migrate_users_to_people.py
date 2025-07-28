import os
from pymongo import MongoClient
from datetime import datetime

# Load environment variables if needed
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')
MONGO_DB_NAME = os.environ.get('MONGO_DB_NAME', 'grandmagnum')

client = MongoClient(MONGO_URI)
db = client[MONGO_DB_NAME]

users_collection = db.users
people_collection = db.people

users = list(users_collection.find())

added = 0
skipped = 0
for user in users:
    name = user.get('name', '').strip()
    email = user.get('email', '').strip()
    if not name and not email:
        continue
    query = {}
    if name:
        query['name'] = name
    if email:
        query['email'] = email
    if not people_collection.find_one(query):
        doc = {'created_at': datetime.now(), 'updated_at': datetime.now()}
        if name:
            doc['name'] = name
        if email:
            doc['email'] = email
        people_collection.insert_one(doc)
        added += 1
    else:
        skipped += 1

print(f"Migration complete. Added: {added}, Skipped (already present): {skipped}") 