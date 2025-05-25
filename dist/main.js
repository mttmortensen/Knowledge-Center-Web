"use strict";
class KnowledgeNode {
    constructor(title, domain) {
        this.title = title;
        this.domain = domain;
    }
    display() {
        console.log(`📘 ${this.title} (${this.domain})`);
    }
}
const node = new KnowledgeNode("DNS Lookup", "Networking");
node.display();
