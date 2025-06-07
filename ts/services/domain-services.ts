import { Domains  } from "../types/domains";

const API_BASE_URL = "http://localhost:8080/api/domains";

export async function getAllDomains(): Promise<Domains[]>
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

export async function getADomainById(id: number): Promise<Domains | null> 
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

export async function createDomain(domain: any): Promise<boolean> 
{
    try
    {
        const response = await fetch(API_BASE_URL, 
        {
            method: "POST",
            headers: 
            {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(domain)
        })

        return response.ok;
    }
    catch (err)
    {
        console.error("❌ Error creating domain:", err);
        return false;
    }
}