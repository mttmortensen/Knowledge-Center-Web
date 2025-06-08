import { LogEntry } from "../types/log-entry";

const API_BASE_URL = "http://localhost:8080/api/logs";

export async function getAllLogs(): Promise<LogEntry[]>
{
    try
    {
        const response = await fetch(API_BASE_URL);
        if (!response.ok) 
        {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data: LogEntry[] = await response.json();
        return data;
    }
    catch (error)
    {
        console.error(`Failed to fetch Domains: ${error}`)
        return [];
    }    
}

export async function getALogById(id: number): Promise<LogEntry | null> 
{
    try 
    {
        const response = await fetch(`${API_BASE_URL}/${id}`);
        if(!response.ok) 
        {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: LogEntry = await response.json();
        return data;
    }
    catch(error)
    {
        console.error(`Failed to get Domain by Id ${id}: ${error}`);
        return null;
    }
}

export async function createLog(log: any): Promise<boolean> 
{
  try 
  {
    const response = await fetch(API_BASE_URL, 
    {
      method: "POST",
      headers: 
      {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(log),
    });

    return response.ok;
  } 
  catch (error) 
  {
    console.error("❌ Failed to create log:", error);
    return false;
  }
}
