import { Headphones, PenLine } from "lucide-react";

const Features = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-16">
            <div className="bg-card p-6 rounded-lg shadow-sm border">
                <div className="mb-4 bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                    <PenLine className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-medium mb-2">Upload Handwriting</h3>
                <p className="text-muted-foreground text-sm">Preserve personal handwritten notes, letters, and documents in high resolution.</p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-sm border">
                <div className="mb-4 bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                    <Headphones className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-medium mb-2">Record Audio</h3>
                <p className="text-muted-foreground text-sm">Add voice recordings to complement handwritten content, capturing tone and emotion.</p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-sm border">
                <div className="mb-4 bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
                        <circle cx="12" cy="12" r="10" />
                        <path d="m12 6 4 6h-8Z" />
                        <path d="m12 18-4-6h8Z" />
                    </svg>
                </div>
                <h3 className="text-xl font-medium mb-2">Organize & Share</h3>
                <p className="text-muted-foreground text-sm">Categorize entries alphabetically and share your collection with family and friends.</p>
            </div>
        </div>
    )
}

export default Features;