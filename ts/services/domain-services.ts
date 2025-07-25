import { Domains, DomainWithKnowledgeNodes  } from "../types/domains";
import { authFetch } from "./fetch-wrapper.js";

const API_BASE_URL = "https://api.mortensens.xyz/kc/api";

export async function getAllDomains(): Promise<Domains[]>
{
    try
    {
        const response = await authFetch(`${API_BASE_URL}/domains`);
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

export async function getADomainById(id: number): Promise<DomainWithKnowledgeNodes | null> 
{
    try 
    {
        const response = await authFetch(`${API_BASE_URL}/domains/${id}`);
        if(!response.ok) 
        {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: DomainWithKnowledgeNodes = await response.json();
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
        const response = await authFetch(`${API_BASE_URL}/domains`, {
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
        const response = await authFetch(`${API_BASE_URL}/domains/${domain.DomainId}`, {
            method: "PUT",
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
        const response = await authFetch(`${API_BASE_URL}/domains/${domainId}`, {
            method: "DELETE",
        });;

        return response.ok;
    } catch (error) {
        console.error("Failed to delete domain:", error);
        return false;
    }
}
