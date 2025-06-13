import { Tag } from "../types/tags";
import { authFetch } from "./fetch-wrapper.js";

const API_BASE_URL = "http://localhost:8080/api/tags";

export async function getAllTags(): Promise<Tag[]>
{
    try
    {
        const response = await authFetch(API_BASE_URL);
        if (!response.ok) 
        {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data: Tag[] = await response.json();
        return data;
    }
    catch (error)
    {
        console.error(`Failed to fetch Domains: ${error}`)
        return [];
    }    
}

export async function getATagById(tagId: number): Promise<any | null> 
{
    try 
    {
        const response = await authFetch(`${API_BASE_URL}/${tagId}`);

        if (!response.ok) 
        {
            console.error(`❌ Failed to fetch tag with ID ${tagId}`);
            return null;
        }

        const tag = await response.json();
        return tag;
    } 
    catch (error) 
    {
        console.error("❌ Error fetching tag by ID:", error);
        return null;
    }
}


export async function createTag(tagData: { Name: string }): Promise<boolean> {
    try {
        const response = await fetch(API_BASE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(tagData)
        });

        return response.ok;
    } catch (error) {
        console.error("Failed to create tag:", error);
        return false;
    }
}

export async function updateATag(tag: any): Promise<boolean> {
    try 
    {
        const response = await authFetch(`${API_BASE_URL}/${tag.TagId}`);

        return response.ok;
    } 
    catch (error) 
    {
        console.error("❌ Failed to update Tag:", error);
        return false;
    }
}

export async function deleteATag(tagId: number): Promise<boolean> {
    try {
        const response = await authFetch(`${API_BASE_URL}/tags/${tagId}`);
        return response.ok;
    } catch (error) {
        console.error("Failed to delete tag:", error);
        return false;
    }
}
