import { Injectable, Renderer2, RendererFactory2 } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class StyleSwitcherService {
    renderer: Renderer2;

    constructor(rendererFactory: RendererFactory2) {
        this.renderer = rendererFactory.createRenderer(null, null);
    }

    async addStyle(href: string): Promise<void> {
       // this.removeExistingStyles(); // Remove previous styles if needed
        const link = this.renderer.createElement('link');
        this.renderer.setAttribute(link, 'rel', 'stylesheet');
        this.renderer.setAttribute(link, 'type', 'text/css');
        
        // Adding a timestamp to bust cache
        this.renderer.setAttribute(link, 'href', `${href}`);
        
        // Optional: If using CDN, you can set SRI (Subresource Integrity)
        // this.renderer.setAttribute(link, 'integrity', 'sha384-...');
        // this.renderer.setAttribute(link, 'crossorigin', 'anonymous');

        link.onload = () => console.log(`${href} loaded successfully`);
        link.onerror = (error: any) => console.error(`Failed to load ${href}`, error);

        //this.renderer.appendChild(document.head, link);
    }

    removeExistingStyles(): void {
        const existingLinks = document.querySelectorAll('link[rel="stylesheet"]');
        existingLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href?.includes('styles.css') || href?.includes('enhanced-styles.css')) {
                link.parentNode?.removeChild(link);
                console.log(`Removed: ${href}`);
            }
        });
    }
}