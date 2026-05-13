from sqlalchemy import text
from db import engine, Base
from models import *

with engine.connect() as conn:
    conn.execute(text("CREATE EXTENSION IF NOT EXISTS btree_gist"))
    conn.commit()

Base.metadata.create_all(bind=engine)
print("Tables created successfully!")
