class KnowledgeNode {
  constructor(
    public title: string,
    public domain: string
  ) {}

  display(): void {
    console.log(`📘 ${this.title} (${this.domain})`);
  }
}

const node = new KnowledgeNode("DNS Lookup", "Networking");
node.display();
