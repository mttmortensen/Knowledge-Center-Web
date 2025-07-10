import { LogEntry } from "../types/log-entry";
import { authFetch } from "./fetch-wrapper.js";

const API_BASE_URL = "https://api.mortensens.xyz/kc/api";

export async function getAllLogs(): Promise<LogEntry[]>
{
    try
    {
        const response = await authFetch(`${API_BASE_URL}/logs`);
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
        const response = await authFetch(`${API_BASE_URL}/logs/${id}`);
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
    const response = await authFetch(`${API_BASE_URL}/logs`, {
        method: "POST",
        body: JSON.stringify(log)
    });

    return response.ok;
  } 
  catch (error) 
  {
    console.error("❌ Failed to create log:", error);
    return false;
  }
}
