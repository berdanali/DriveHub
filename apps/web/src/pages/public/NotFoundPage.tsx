import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
            <div className="text-center max-w-md">
                <div className="text-8xl font-bold text-primary/20 mb-4">404</div>
                <h1 className="text-2xl font-bold mb-2">Sayfa Bulunamadı</h1>
                <p className="text-muted-foreground mb-8">
                    Aradığınız sayfa mevcut değil veya taşınmış olabilir.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        to="/"
                        className="btn-primary px-6 py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2"
                    >
                        <Home className="h-4 w-4" />
                        Ana Sayfa
                    </Link>
                    <Link
                        to="/vehicles"
                        className="px-6 py-3 rounded-lg border border-border font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2"
                    >
                        <Search className="h-4 w-4" />
                        Araç Ara
                    </Link>
                </div>
                <button
                    onClick={() => window.history.back()}
                    className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1 mx-auto"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Geri Dön
                </button>
            </div>
        </div>
    );
}

