import { KnowledgeNode  } from "../types/knowledge-node";

const API_BASE_URL = "http://localhost:8080/api/knowledge-nodes";

export async function getAllKnowledgeNodes(): Promise<KnowledgeNode[]>
{
    try
    {
        const response = await fetch(API_BASE_URL);
        if (!response.ok) 
        {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data: KnowledgeNode[] = await response.json();
        return data;
    }
    catch (error)
    {
        console.error(`Failed to fetch Knowledge Nodes: ${error}`)
        return [];
    }    
}

export async function getAKnowledgeNodeById(id: number): Promise<KnowledgeNode | null> 
{
    try 
    {
        const response = await fetch(`${API_BASE_URL}/${id}`);
        if(!response.ok) 
        {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: KnowledgeNode = await response.json();
        return data;
    }
    catch(error)
    {
        console.error(`Failed to get Knowledge Node by Id ${id}: ${error}`);
        return null;
    }
}