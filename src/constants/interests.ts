// Predefined interests that users can select from
export const PREDEFINED_INTERESTS = [
  // Deportes y Fitness
  'Fútbol',
  'Baloncesto',
  'Natación',
  'Yoga',
  'Gimnasio',
  'Running',
  'Ciclismo',
  'Tenis',
  'Senderismo',
  'Escalada',
  
  // Entretenimiento
  'Música',
  'Películas',
  'Series',
  'Videojuegos',
  'Lectura',
  'Teatro',
  'Conciertos',
  'Anime',
  'Podcasts',
  'Stand-up',
  
  // Arte y Creatividad
  'Fotografía',
  'Pintura',
  'Diseño',
  'Escritura',
  'Manualidades',
  'Escultura',
  
  // Gastronomía
  'Cocina',
  'Repostería',
  'Vino',
  'Café',
  'Cerveza artesanal',
  'Restaurantes',
  'Comida internacional',
  
  // Viajes y Aventura
  'Viajes',
  'Playa',
  'Montaña',
  'Camping',
  'Mochilero',
  'Road trips',
  
  // Mascotas
  'Perros',
  'Gatos',
  'Animales',
  
  // Estilo de vida
  'Moda',
  'Meditación',
  'Bienestar',
  'Naturaleza',
  'Jardinería',
  'Voluntariado',
  
  // Tecnología
  'Tecnología',
  'Startups',
  'Criptomonedas',
  'Inteligencia Artificial',
  
  // Social
  'Fiestas',
  'Baile',
  'Karaoke',
  'Brunch',
  'Cenas grupales',
  'Networking',
  
  // Otros
  'Astrología',
  'Tarot',
  'Idiomas',
  'Historia',
  'Ciencia',
  'Política',
] as const;

export type Interest = typeof PREDEFINED_INTERESTS[number];

// Countries list for location selection
export const COUNTRIES = [
  'Argentina',
  'Bolivia',
  'Brasil',
  'Chile',
  'Colombia',
  'Costa Rica',
  'Cuba',
  'Ecuador',
  'El Salvador',
  'España',
  'Estados Unidos',
  'Guatemala',
  'Honduras',
  'México',
  'Nicaragua',
  'Panamá',
  'Paraguay',
  'Perú',
  'Puerto Rico',
  'República Dominicana',
  'Uruguay',
  'Venezuela',
] as const;

export type Country = typeof COUNTRIES[number];

// Cities by country
export const CITIES_BY_COUNTRY: Record<string, string[]> = {
  'Argentina': ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'Mar del Plata', 'Tucumán', 'Salta'],
  'Bolivia': ['La Paz', 'Santa Cruz', 'Cochabamba', 'Sucre', 'Oruro', 'Tarija', 'Potosí'],
  'Brasil': ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Curitiba', 'Recife'],
  'Chile': ['Santiago', 'Valparaíso', 'Concepción', 'La Serena', 'Antofagasta', 'Temuco', 'Viña del Mar'],
  'Colombia': ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Pereira'],
  'Costa Rica': ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Limón', 'Puntarenas'],
  'Cuba': ['La Habana', 'Santiago de Cuba', 'Camagüey', 'Holguín', 'Santa Clara', 'Guantánamo'],
  'Ecuador': ['Quito', 'Guayaquil', 'Cuenca', 'Manta', 'Ambato', 'Machala', 'Loja'],
  'El Salvador': ['San Salvador', 'Santa Ana', 'San Miguel', 'Mejicanos', 'Santa Tecla'],
  'España': ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza', 'Málaga', 'Bilbao', 'Alicante'],
  'Estados Unidos': ['Nueva York', 'Los Ángeles', 'Chicago', 'Houston', 'Miami', 'San Francisco', 'Dallas', 'Boston'],
  'Guatemala': ['Ciudad de Guatemala', 'Mixco', 'Villa Nueva', 'Quetzaltenango', 'Petapa'],
  'Honduras': ['Tegucigalpa', 'San Pedro Sula', 'Choloma', 'La Ceiba', 'El Progreso'],
  'México': ['Ciudad de México', 'Guadalajara', 'Monterrey', 'Puebla', 'Cancún', 'Tijuana', 'Mérida', 'León'],
  'Nicaragua': ['Managua', 'León', 'Masaya', 'Chinandega', 'Matagalpa', 'Granada'],
  'Panamá': ['Ciudad de Panamá', 'San Miguelito', 'Colón', 'David', 'Arraiján'],
  'Paraguay': ['Asunción', 'Ciudad del Este', 'San Lorenzo', 'Luque', 'Capiatá'],
  'Perú': ['Lima', 'Arequipa', 'Trujillo', 'Chiclayo', 'Cusco', 'Piura', 'Iquitos'],
  'Puerto Rico': ['San Juan', 'Bayamón', 'Carolina', 'Ponce', 'Caguas', 'Mayagüez'],
  'República Dominicana': ['Santo Domingo', 'Santiago', 'La Romana', 'San Pedro de Macorís', 'Puerto Plata'],
  'Uruguay': ['Montevideo', 'Salto', 'Ciudad de la Costa', 'Paysandú', 'Las Piedras'],
  'Venezuela': ['Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto', 'Maracay', 'Ciudad Guayana'],
};
