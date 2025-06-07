import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_supabase_client() -> Client:
    """
    Create and return a Supabase client instance
    """
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables")
    
    supabase: Client = create_client(url, key)
    return supabase

# Example usage for direct database operations if needed
def test_connection():
    """
    Test the Supabase connection
    """
    try:
        supabase = get_supabase_client()
        # Test with a simple query
        result = supabase.table('auth.users').select('*').limit(1).execute()
        print("Supabase connection successful!")
        return True
    except Exception as e:
        print(f"Supabase connection failed: {e}")
        return False