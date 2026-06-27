import { ShoppingCart, Leaf, Truck, Award } from "lucide-react";
import { useState } from "react";

export default function Index() {
  const [cart, setCart] = useState<Record<number, number>>({});

  const toggleCart = (productId: number) => {
    setCart((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-primary/10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-serif font-bold text-primary">
            Mate<span className="text-secondary">Co</span>
          </div>
          <nav className="hidden md:flex gap-8">
            <a href="#categories" className="text-foreground hover:text-primary transition">
              Categorías
            </a>
            <a href="#products" className="text-foreground hover:text-primary transition">
              Productos
            </a>
            <a href="#about" className="text-foreground hover:text-primary transition">
              Sobre Nosotros
            </a>
          </nav>
          <div className="relative">
            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition">
              <ShoppingCart size={20} />
              <span className="text-sm font-semibold">
                {Object.values(cart).reduce((a, b) => a + b, 0)}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-white to-secondary/5 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-slideUp">
              <div className="inline-block bg-secondary/10 text-secondary px-3 py-1 rounded-full text-sm font-semibold">
                Tradición Artesanal Argentina
              </div>
              <h1 className="text-5xl md:text-6xl font-serif font-bold text-foreground leading-tight">
                Experimenta la Esencia del Mate
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg">
                Descubre nuestra selección premium de mates, termos y bombillas artesanales, cultivados y crafted en Argentina con tradición.
              </p>
              <button className="bg-primary text-primary-foreground px-8 py-4 rounded-lg font-semibold hover:bg-primary/90 transition transform hover:scale-105">
                Comprar Ahora
              </button>
            </div>
            <div className="relative h-96 md:h-full flex items-center justify-center animate-fadeIn">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl transform rotate-3"></div>
              <div className="relative bg-white/80 backdrop-blur rounded-3xl p-8 shadow-2xl transform -rotate-3">
                <div className="w-full h-80 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <Leaf className="w-24 h-24 text-primary mx-auto mb-4" />
                    <p className="text-primary font-semibold">Premium Mate Selection</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-serif font-bold text-center text-foreground mb-16">
            Nuestras Categorías
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Mates",
                description: "Mates artesanales de calabaza y madera, decorados con técnicas tradicionales",
                icon: "🥒",
              },
              {
                title: "Termos",
                description: "Termos aislantes de calidad premium para mantener tu mate caliente todo el día",
                icon: "🫖",
              },
              {
                title: "Bombillas",
                description: "Bombillas de plata pura y alpaca, piezas de colección y uso diario",
                icon: "✨",
              },
            ].map((category, idx) => (
              <div
                key={idx}
                className="group bg-gradient-to-br from-white to-primary/5 border border-primary/10 rounded-2xl p-8 hover:shadow-xl transition transform hover:-translate-y-2"
              >
                <div className="text-5xl mb-4">{category.icon}</div>
                <h3 className="text-2xl font-serif font-bold text-foreground mb-3">
                  {category.title}
                </h3>
                <p className="text-muted-foreground">{category.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section id="products" className="py-16 md:py-24 bg-gradient-to-b from-primary/2 to-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-serif font-bold text-center text-foreground mb-4">
            Productos Destacados
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-xl mx-auto">
            Selección curada de nuestros mejores productos, elegidos por su calidad excepcional y artesanía.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                id: 1,
                name: "Mate Calabaza Grabado",
                price: "$45.00 ARS",
                image: "🥒",
                category: "Mates",
              },
              {
                id: 2,
                name: "Termo Acero Inoxidable",
                price: "$89.00 ARS",
                image: "🫖",
                category: "Termos",
              },
              {
                id: 3,
                name: "Bombilla Plata Pura",
                price: "$120.00 ARS",
                image: "✨",
                category: "Bombillas",
              },
              {
                id: 4,
                name: "Set Mate Completo",
                price: "$150.00 ARS",
                image: "🥒",
                category: "Mates",
              },
              {
                id: 5,
                name: "Termo Vintage Esmaltado",
                price: "$110.00 ARS",
                image: "🫖",
                category: "Termos",
              },
              {
                id: 6,
                name: "Bombilla Alpaca Decorada",
                price: "$85.00 ARS",
                image: "✨",
                category: "Bombillas",
              },
            ].map((product) => (
              <div
                key={product.id}
                className="bg-white border border-primary/10 rounded-2xl overflow-hidden hover:shadow-xl transition group"
              >
                <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:scale-105 transition">
                  <span className="text-6xl">{product.image}</span>
                </div>
                <div className="p-6">
                  <p className="text-sm text-secondary font-semibold mb-2">
                    {product.category}
                  </p>
                  <h3 className="text-xl font-serif font-bold text-foreground mb-2">
                    {product.name}
                  </h3>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-primary">
                      {product.price}
                    </span>
                    <button
                      onClick={() => toggleCart(product.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition transform hover:scale-105 ${
                        cart[product.id]
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                    >
                      <ShoppingCart size={18} />
                      <span>{cart[product.id] ? `${cart[product.id]}` : "Agregar"}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Artisanal & Shipping Section */}
      <section id="about" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Artisanal Quality */}
            <div className="space-y-6 flex flex-col justify-center">
              <div className="inline-flex items-center gap-3 text-primary mb-2">
                <Award size={24} />
                <span className="font-semibold">Calidad Artesanal</span>
              </div>
              <h2 className="text-4xl font-serif font-bold text-foreground">
                Crafted con Tradición
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Cada mate, termo y bombilla es cuidadosamente seleccionado y preparado siguiendo técnicas tradicionales argentinas. Nuestros artesanos tienen más de 50 años de experiencia combinada, garantizando la más alta calidad en cada pieza.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Utilizamos solo materiales premium: calabazas cultivadas localmente, maderas nobles, y plata pura. Cada producto es una obra maestra única que celebra la rica herencia del mate argentino.
              </p>
            </div>

            {/* Nationwide Shipping */}
            <div className="space-y-6 flex flex-col justify-center">
              <div className="inline-flex items-center gap-3 text-secondary mb-2">
                <Truck size={24} />
                <span className="font-semibold">Envíos a Todo el País</span>
              </div>
              <h2 className="text-4xl font-serif font-bold text-foreground">
                Entrega Rápida y Segura
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Enviamos a todas las provincias de Argentina con garantía de entrega. Tu pedido llega cuidadosamente empaquetado en 2-5 días hábiles, dependiendo de tu ubicación.
              </p>
              <ul className="space-y-3">
                {[
                  "Envío gratis para compras mayores a $500",
                  "Empaque premium para proteger tus productos",
                  "Rastreo en tiempo real de tu pedido",
                  "Garantía de satisfacción 100%",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-secondary rounded-full"></div>
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-primary via-primary/80 to-secondary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary-foreground mb-6">
            ¿Listo para disfrutar del mejor mate?
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Únete a miles de argentinos que ya disfrutan de la experiencia MateCo. Cada compra incluye una guía de degustación exclusiva.
          </p>
          <button className="bg-primary-foreground text-primary px-8 py-4 rounded-lg font-semibold hover:bg-white transition transform hover:scale-105">
            Ver Colección Completa
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="text-2xl font-serif font-bold mb-4">MateCo</h3>
              <p className="text-sm opacity-75">
                Celebrando la tradición del mate argentino con productos premium y artesanales.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Productos</h4>
              <ul className="space-y-2 text-sm opacity-75">
                <li><a href="#categories" className="hover:text-primary-foreground transition">Mates</a></li>
                <li><a href="#categories" className="hover:text-primary-foreground transition">Termos</a></li>
                <li><a href="#categories" className="hover:text-primary-foreground transition">Bombillas</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Información</h4>
              <ul className="space-y-2 text-sm opacity-75">
                <li><a href="#about" className="hover:text-primary-foreground transition">Sobre Nosotros</a></li>
                <li><a href="#about" className="hover:text-primary-foreground transition">Envíos</a></li>
                <li><a href="#" className="hover:text-primary-foreground transition">Contacto</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Conecta</h4>
              <ul className="space-y-2 text-sm opacity-75">
                <li><a href="#" className="hover:text-primary-foreground transition">Instagram</a></li>
                <li><a href="#" className="hover:text-primary-foreground transition">Facebook</a></li>
                <li><a href="#" className="hover:text-primary-foreground transition">WhatsApp</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-primary-foreground/20 pt-8">
            <p className="text-center text-sm opacity-75">
              © 2024 MateCo. Todos los derechos reservados. | Hecho con ❤️ en Argentina
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
