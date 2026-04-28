"""
Seed script to create the initial super_admin user.
Run this ONCE during initial setup.

Usage: python seed_super_admin.py
"""
from db import SessionLocal
from models import User, Organisation, UserRole
from auth import hash_password
import os
from dotenv import load_dotenv

load_dotenv()

SUPER_ADMIN_USERNAME = os.getenv("SUPER_ADMIN_USERNAME", "superadmin")
SUPER_ADMIN_PASSWORD = os.getenv("SUPER_ADMIN_PASSWORD", "SuperAdmin@123!")
SUPER_ADMIN_EMAIL = os.getenv("SUPER_ADMIN_EMAIL", "superadmin@system.local")

def seed_super_admin():
    db = SessionLocal()
    
    try:
        existing = db.query(User).filter(User.username == SUPER_ADMIN_USERNAME).first()
        if existing:
            print(f"Super admin '{SUPER_ADMIN_USERNAME}' already exists.")
            return
        
        super_admin = User(
            username=SUPER_ADMIN_USERNAME,
            password=hash_password(SUPER_ADMIN_PASSWORD),
            email=SUPER_ADMIN_EMAIL,
            role=UserRole.SUPER_ADMIN,
            organisation_id=None
        )
        db.add(super_admin)
        db.commit()
        
        print(f"Super Admin created successfully!")
        print(f"Username: {SUPER_ADMIN_USERNAME}")
        print(f"Password: {SUPER_ADMIN_PASSWORD}")
        print("\nIMPORTANT: Change these credentials in production!")
        print(f"Set these environment variables:")
        print(f"  SUPER_ADMIN_USERNAME={SUPER_ADMIN_USERNAME}")
        print(f"  SUPER_ADMIN_PASSWORD=<your-secure-password>")
        
    except Exception as e:
        db.rollback()
        print(f"Error creating super admin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_super_admin()
