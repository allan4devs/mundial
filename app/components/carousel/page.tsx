import { getImages } from "@/lib/helpers/getImages";
import Image from "next/image";

export default function GalleryPage() {
  const galleryImages = getImages();

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black flex justify-center py-10 px-4">
      <div className="w-full max-w-6xl bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl p-10 border border-zinc-200 dark:border-zinc-800">
        <h1 className="text-3xl font-bold mb-10 text-center">Galería La Vieja Adventures</h1>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryImages.map((src, index) => (
            <div
              key={index}
              className="w-full h-60 bg-zinc-200 dark:bg-zinc-800 rounded-xl overflow-hidden shadow-lg hover:scale-[1.02] transition-transform"
            >
              <Image
                src={src}
                alt={`Tour La Vieja Adventures ${index + 1}`}
                width={800}
                height={600}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </section>

        <p className="text-center text-zinc-600 dark:text-zinc-400 mt-10 text-sm">
          Imágenes representativas de nuestros tours: Ciudad Esmeralda, cuadra-tours, cabaños, senderos, cascadas, gastronomía, lluvia en la naturaleza, avistamiento de aves, tours nocturnos, rapel, y caminatas por volcanes del Parque Nacional del Agua Juan Castro Blanco.
        </p>
      </div>
    </main>
  );
}
