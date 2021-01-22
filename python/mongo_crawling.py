# insert
def insert_item_one(mongo, data, db_name=None, collection_name=None):
    result = mongo[db_name][collection_name].insert_one(data).inserted_id
    return result

def insert_item_many(mongo, datas, db_name=None, collection_name=None):
    result = mongo[db_name][collection_name].insert_many(datas).inserted_ids
    return result

# find
def find_item_one(mongo, condition=None, db_name=None, collection_name=None):
    result = mongo[db_name][collection_name].find_one(condition, {"_id": False})
    return result

def find_item(mongo, condition=None, db_name=None, collection_name=None):
    result = mongo[db_name][collection_name].find(condition, {"_id": False}, no_cursor_timeout=True, cursor_type=CursorType.EXHAUST)
    return result

# delete
def delete_item_one(mongo, condition=None, db_name=None, collection_name=None):
    result = mongo[db_name][collection_name].delete_one(condition)
    return result

def delete_item_many(mongo, condition=None, db_name=None, collection_name=None):
    result = mongo[db_name][collection_name].delete_many(condition)
    return result

# update
def update_item_one(mongo, condition=None, update_value=None, db_name=None, collection_name=None):
    result = mongo[db_name][collection_name].update_one(filter=condition, update=update_value)
    return result

def update_item_many(mongo, condition=None, update_value=None, db_name=None, collection_name=None):
    result = mongo[db_name][collection_name].update_many(filter=condition, update=update_value)
    return result

def upsert_item_many(mongo, condition=None, update_value=None, db_name=None, collection_name=None):
    result = mongo[db_name][collection_name].update_many(filter=condition, update=update_value)
    return result

# text search
def text_search(mongo, text=None, db_name=None, collection_name=None):
    result = mongo[db_name][collection_name].find({"$text": {"$search": text}})
    return result