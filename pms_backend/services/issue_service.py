from core.database import get_db

async def generate_issue_identifier(team_id: str) -> str:
    """
    Generates a unique identifier for an issue based on its team's key.
    Example output: 'ENG-142'
    """
    db = get_db()
    
    # 1. Fetch the team to get its unique prefix key
    team = await db["teams"].find_one({"id": team_id})
    if not team:
        count = await db["issues"].count_documents({})
        return f"TSK-{count + 1}"
        
    team_key = team.get("key", "TSK").upper()
    
    # 2. Count existing issues for this team to get the next number
    # Note: In a massive scale production app, you would use MongoDB's 
    # findOneAndUpdate on a dedicated 'counters' collection for atomic safety.
    issue_count = await db["issues"].count_documents({"teamId": team_id})
    next_number = issue_count + 1
    
    return f"{team_key}-{next_number}"