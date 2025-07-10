import { Domains  } from "../types/domains";
import { authFetch } from "./fetch-wrapper.js";

const API_BASE_URL = "https://api.mortensens.xyz/kc/api/domains";

export async function getAllDomains(): Promise<Domains[]>
{
    try
    {
        const response = await authFetch(API_BASE_URL);
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
        const response = await authFetch(`${API_BASE_URL}/${id}`);
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
        const response = await authFetch(API_BASE_URL, {
            method: "POST",
            body: JSON.stringify(domain)
        });

        return response.ok;
    }
    catch (err)
    {
        console.error("❌ Error creating domain:", err);
        return false;
    }
}

export async function updateADomain(domain: any): Promise<boolean> 
{
    try 
    {
        const response = await authFetch(`${API_BASE_URL}/${domain.domainId}`, {
            method: "POST",
            body: JSON.stringify(domain)
        });

        return response.ok;
    } 
    catch (error) 
    {
        console.error("❌ Failed to update Domain:", error);
        return false;
    }
}

export async function deleteADomain(domainId: number): Promise<boolean> {
    try {
        const response = await authFetch(`${API_BASE_URL}/${domainId}`, {
            method: "DELETE",
        });;

        return response.ok;
    } catch (error) {
        console.error("Failed to delete domain:", error);
        return false;
    }
}
