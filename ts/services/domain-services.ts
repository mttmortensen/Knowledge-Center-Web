import { Domains  } from "../types/domains";

const API_BASE_URL = "http://localhost:8080/api/domains";

export async function getAllKnowledgeNodes(): Promise<Domains[]>
{
    try
    {
        const response = await fetch(API_BASE_URL);
        if (!response.ok) 
        {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data: Domains[] = await response.json();
        return data;
    }
    catch (error)
    {
        console.error(`Failed to fetch Domains: ${error}`)
        return [];
    }    
}

export async function getAKnowledgeNodeById(id: number): Promise<Domains | null> 
{
    try 
    {
        const response = await fetch(`${API_BASE_URL}/${id}`);
        if(!response.ok) 
        {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: Domains = await response.json();
        return data;
    }
    catch(error)
    {
        console.error(`Failed to get Domain by Id ${id}: ${error}`);
        return null;
    }
}