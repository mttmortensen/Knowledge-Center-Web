import { getAllKnowledgeNodes } from "../services/knowledge-node-service";

getAllKnowledgeNodes().then((nodes) => 
{
    console.log(`Here be the Knowledge Nodes: ${nodes}`);
})