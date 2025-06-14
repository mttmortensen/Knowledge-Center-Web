import { KnowledgeNode  } from "../types/knowledge-node";
import { authFetch } from "./fetch-wrapper.js";

const API_BASE_URL = "http://localhost:8080/api/knowledge-nodes";

export async function getAllKnowledgeNodes(): Promise<KnowledgeNode[]>
{
    try
    {
        const response = await authFetch(API_BASE_URL); // <-- token is now included automatically

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
        const response = await authFetch(`${API_BASE_URL}/${id}`);
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

export async function createKnowledgeNode(KnowledgeNode: Omit<KnowledgeNode, "Id">): Promise<boolean> {
    try {

        const response = await authFetch(API_BASE_URL, {
            method: "POST",
            body: JSON.stringify(KnowledgeNode)
        });

        return response.ok;
    } 
    catch (error) 
    {
        console.error("❌ Failed to create Knowledge Node:", error);
        return false;
    }
}

export async function updateAKnowledgeNode(KnowledgeNode: any): Promise<boolean> 
{
    try 
    {
        const response = await authFetch(`${API_BASE_URL}/${KnowledgeNode.id}`, {
            method: "PUT",
            body: JSON.stringify(KnowledgeNode)
        });

        return response.ok
    }
    catch (error)
    {
        console.error("❌ Failed to update Knowledge Node:", error);
        return false;
    }
}

export async function deleteAKnowledgeNode(nodeId: number): Promise<boolean> 
{
        try {
        const response = await authFetch(`${API_BASE_URL}/${nodeId}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            console.error(`Failed to delete node ${nodeId}:`, await response.text());
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error deleting knowledge node:", error);
        return false;
    }
}