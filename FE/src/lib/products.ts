export type Specification = { label: string; value: string };

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  oldPrice?: number;
  image: string;
  images?: string[];
  description: string;
  ingredients: string;
  benefits: string[];
  usage: string;
  skinType: string;
  origin: string;
  volume: string;
  expiration: string;
  manufactureDate: string;
  stock: number;
  rating: number;
  reviewCount: number;
  specifications: Specification[];
  bestSeller?: boolean;
  newArrival?: boolean;
  flashSale?: boolean;
};

export const CATEGORIES = [
  "Kem chống nắng",
  "Sữa rửa mặt",
  "Serum",
  "Kem dưỡng",
  "Son môi",
  "Cushion",
  "Phấn phủ",
  "Nước tẩy trang",
  "Toner",
  "Mặt nạ",
];

const img = (seed: string) =>
  `https://images.unsplash.com/photo-${seed}?auto=format&fit=crop&w=800&q=80`;

const IMG_POOL = [
  "1556228720-195a672e8a03",
  "1571875257727-256c39da42af",
  "1522337360788-8b13dee7a37e",
  "1596462502278-27bfdc403348",
  "1620916566398-39f1143ab7be",
  "1608248543803-ba4f8c70ae0b",
  "1631730359585-38a4935cbec4",
  "1585652757141-8837d3f76d3b",
  "1512496015851-a90fb38ba796",
  "1570194065650-d99fb4bedf0a",
  "1583241800698-9c2e0e51b5f8",
  "1598440947619-2c35fc9aa908",
  "1526045478516-99145907023c",
  "1608248511-3d6f1af6a3e0",
  "1617897903246-719242758050",
];

// deterministic pseudo-random from an integer seed (avoids SSR/CSR mismatch)
const seeded = (seed: number) => {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const pickImages = (seed: number) => {
  const start = seed % IMG_POOL.length;
  return [0, 1, 2, 3].map((k) => img(IMG_POOL[(start + k) % IMG_POOL.length]));
};

type Raw = {
  name: string;
  brand: string;
  category: string;
  price: number;
  oldPrice?: number;
  origin: string;
  volume: string;
  skinType: string;
  benefits: string[];
  ingredients: string;
  usage: string;
  flags?: Partial<Product>;
};

const RAW: Raw[] = [
  { name: "Kem chống nắng Sunplay Skin Aqua", brand: "Sunplay", category: "Kem chống nắng", price: 245000, oldPrice: 320000, origin: "Nhật Bản", volume: "55g", skinType: "Mọi loại da", benefits: ["Chống nắng SPF 50+/PA++++", "Kiềm dầu, không gây bết dính", "Bảo vệ da khỏi tia UVA/UVB"], ingredients: "Aqua, Ethylhexyl Methoxycinnamate, Zinc Oxide, Titanium Dioxide, Hyaluronic Acid, Vitamin E.", usage: "Thoa lượng vừa đủ lên da 15 phút trước khi ra ngoài. Thoa lại sau mỗi 2-3 giờ.", flags: { bestSeller: true, flashSale: true } },
  { name: "Kem chống nắng Anessa Perfect UV", brand: "Anessa", category: "Kem chống nắng", price: 520000, oldPrice: 650000, origin: "Nhật Bản", volume: "60ml", skinType: "Da dầu, hỗn hợp", benefits: ["SPF 50+/PA++++ bảo vệ toàn diện", "Chống nước, chống mồ hôi", "Dưỡng ẩm mịn màng"], ingredients: "Aqua, Alcohol, Zinc Oxide, Titanium Dioxide, Glycerin, chiết xuất trà xanh, Collagen.", usage: "Lắc đều trước khi sử dụng. Thoa đều lên da mặt và cổ trước khi ra ngoài.", flags: { bestSeller: true } },
  { name: "Sữa rửa mặt Cetaphil Gentle", brand: "Cetaphil", category: "Sữa rửa mặt", price: 285000, oldPrice: 340000, origin: "Pháp", volume: "250ml", skinType: "Da nhạy cảm", benefits: ["Làm sạch dịu nhẹ", "Không gây khô căng", "Cân bằng pH tự nhiên"], ingredients: "Aqua, Cetyl Alcohol, Propylene Glycol, Sodium Lauryl Sulfate, Stearyl Alcohol, Methylparaben.", usage: "Làm ướt mặt, lấy lượng vừa đủ, massage nhẹ 30 giây rồi rửa sạch với nước.", flags: { bestSeller: true } },
  { name: "Sữa rửa mặt Simple Kind To Skin", brand: "Simple", category: "Sữa rửa mặt", price: 149000, oldPrice: 189000, origin: "Anh Quốc", volume: "150ml", skinType: "Da nhạy cảm", benefits: ["Không hương liệu, không cồn", "Làm sạch bụi bẩn và trang điểm nhẹ", "Cấp ẩm cho da"], ingredients: "Aqua, Glycerin, Panthenol (Pro-Vitamin B5), chiết xuất hoa cúc.", usage: "Thoa lên mặt ẩm, massage nhẹ và rửa sạch với nước ấm.", flags: { newArrival: true } },
  { name: "Serum Vitamin C Klairs", brand: "Klairs", category: "Serum", price: 420000, oldPrice: 520000, origin: "Hàn Quốc", volume: "35ml", skinType: "Da xỉn màu, không đều màu", benefits: ["Làm sáng da", "Mờ thâm nám", "Chống oxy hóa mạnh mẽ"], ingredients: "Ascorbic Acid 5%, Centella Asiatica, Hyaluronic Acid, chiết xuất yuja.", usage: "Sau bước toner, nhỏ 3-4 giọt lên mặt, vỗ nhẹ đến khi thẩm thấu.", flags: { bestSeller: true, flashSale: true } },
  { name: "Serum The Ordinary Niacinamide 10%", brand: "The Ordinary", category: "Serum", price: 220000, oldPrice: 280000, origin: "Canada", volume: "30ml", skinType: "Da dầu, da mụn", benefits: ["Kiểm soát bã nhờn", "Se khít lỗ chân lông", "Cải thiện tông màu da"], ingredients: "Niacinamide 10%, Zinc PCA 1%, Pentylene Glycol, Tamarindus Indica Seed Gum.", usage: "Sáng và tối, nhỏ vài giọt lên da sạch trước kem dưỡng.", flags: { newArrival: true } },
  { name: "Serum Hyaluronic Acid HADA LABO", brand: "Hada Labo", category: "Serum", price: 310000, oldPrice: 380000, origin: "Nhật Bản", volume: "30ml", skinType: "Da khô, thiếu ẩm", benefits: ["Cấp ẩm sâu 3 tầng", "Da căng bóng, mịn màng", "Không nhờn rít"], ingredients: "Aqua, Butylene Glycol, Sodium Hyaluronate, Glycerin.", usage: "Sau khi rửa mặt và toner, thoa 2-3 giọt lên mặt và cổ." },
  { name: "Kem dưỡng ẩm Neutrogena Hydro Boost", brand: "Neutrogena", category: "Kem dưỡng", price: 289000, oldPrice: 359000, origin: "Mỹ", volume: "50g", skinType: "Da khô, thiếu ẩm", benefits: ["Cấp ẩm liên tục 24 giờ", "Kết cấu gel mát dịu", "Không chứa dầu, không gây bít tắc"], ingredients: "Aqua, Glycerin, Dimethicone, Hyaluronic Acid, Sodium Hyaluronate.", usage: "Thoa buổi sáng và tối lên da sạch, massage nhẹ đến khi thẩm thấu.", flags: { bestSeller: true } },
  { name: "Kem dưỡng Laneige Water Bank", brand: "Laneige", category: "Kem dưỡng", price: 690000, oldPrice: 850000, origin: "Hàn Quốc", volume: "50ml", skinType: "Da hỗn hợp, da thường", benefits: ["Cấp nước tức thì", "Củng cố hàng rào bảo vệ da", "Da mềm mượt suốt cả ngày"], ingredients: "Aqua, Glycerin, Green Mineral Water, Hyaluronic Acid, chiết xuất rong biển.", usage: "Lấy lượng vừa đủ, thoa đều lên mặt sau bước serum, dùng sáng và tối.", flags: { newArrival: true } },
  { name: "Son môi 3CE Velvet Lip Tint", brand: "3CE", category: "Son môi", price: 275000, oldPrice: 330000, origin: "Hàn Quốc", volume: "4g", skinType: "Mọi loại môi", benefits: ["Lên màu chuẩn 1 lớp", "Chất son lì mịn như nhung", "Bám màu lâu tới 8 giờ"], ingredients: "Isododecane, Dimethicone, Silica, chiết xuất Vitamin E.", usage: "Thoa trực tiếp lên môi. Có thể dặm nhẹ để tạo hiệu ứng ombre.", flags: { bestSeller: true, flashSale: true } },
  { name: "Son môi MAC Ruby Woo Matte", brand: "MAC", category: "Son môi", price: 690000, oldPrice: 790000, origin: "Mỹ", volume: "3g", skinType: "Mọi loại môi", benefits: ["Màu đỏ ruby cổ điển", "Chất son lì tuyệt đối", "Không bị lem, giữ màu lâu"], ingredients: "Ricinus Communis Seed Oil, Ozokerite, Copernicia Cerifera Wax, Vitamin E.", usage: "Tẩy da chết môi trước khi sử dụng để lên màu chuẩn nhất." },
  { name: "Son môi Merzy The First Velvet", brand: "Merzy", category: "Son môi", price: 189000, oldPrice: 245000, origin: "Hàn Quốc", volume: "4g", skinType: "Mọi loại môi", benefits: ["Chất son mềm mượt", "Bảng màu đa dạng", "Cấp ẩm nhẹ nhàng"], ingredients: "Hydrogenated Polyisobutene, Polybutene, Vitamin E, chiết xuất hoa hồng.", usage: "Thoa trực tiếp, có thể lớp thứ hai để tăng độ đậm màu.", flags: { newArrival: true } },
  { name: "Cushion Missha Magic Cover", brand: "Missha", category: "Cushion", price: 395000, oldPrice: 490000, origin: "Hàn Quốc", volume: "15g", skinType: "Da thường, da khô", benefits: ["Che phủ hoàn hảo", "Lớp nền mỏng nhẹ", "Chống nắng SPF 50+"], ingredients: "Aqua, Titanium Dioxide, Cyclopentasiloxane, Glycerin, Niacinamide.", usage: "Nhấn puff vào cushion và tán đều lên da đã dưỡng ẩm.", flags: { bestSeller: true } },
  { name: "Cushion Innisfree My Cushion", brand: "Innisfree", category: "Cushion", price: 350000, oldPrice: 420000, origin: "Hàn Quốc", volume: "14g", skinType: "Da hỗn hợp", benefits: ["Lớp nền tự nhiên", "Kiềm dầu suốt ngày dài", "Chiết xuất trà xanh Jeju"], ingredients: "Aqua, Cyclopentasiloxane, Camellia Sinensis Leaf Extract, Titanium Dioxide.", usage: "Dùng puff chấm cushion và tán đều theo hướng từ trong ra ngoài." },
  { name: "Phấn phủ Innisfree No Sebum", brand: "Innisfree", category: "Phấn phủ", price: 165000, oldPrice: 210000, origin: "Hàn Quốc", volume: "5g", skinType: "Da dầu", benefits: ["Kiềm dầu tức thì", "Bột phấn siêu mịn", "Không gây bít tắc lỗ chân lông"], ingredients: "Talc, Silica, Zinc Oxide, chiết xuất tràm trà.", usage: "Dùng cọ hoặc bông phấn tán đều lên vùng da tiết nhiều dầu.", flags: { flashSale: true } },
  { name: "Phấn phủ Maybelline Fit Me", brand: "Maybelline", category: "Phấn phủ", price: 199000, oldPrice: 259000, origin: "Mỹ", volume: "8.5g", skinType: "Da thường, da dầu", benefits: ["Che phủ tự nhiên", "Kiềm dầu hiệu quả", "Đa dạng tông màu"], ingredients: "Talc, Mica, Titanium Dioxide, Silica, Vitamin E.", usage: "Tán đều lên da đã trang điểm để cố định lớp nền." },
  { name: "Nước tẩy trang Bioderma Sensibio H2O", brand: "Bioderma", category: "Nước tẩy trang", price: 385000, oldPrice: 460000, origin: "Pháp", volume: "500ml", skinType: "Da nhạy cảm", benefits: ["Làm sạch dịu nhẹ", "Không cần rửa lại với nước", "Làm dịu da kích ứng"], ingredients: "Aqua, PEG-6 Caprylic/Capric Glycerides, Cucumis Sativus Extract, Mannitol.", usage: "Thấm dung dịch vào bông tẩy trang, lau nhẹ lên mặt và mắt.", flags: { bestSeller: true } },
  { name: "Nước tẩy trang Garnier Micellar", brand: "Garnier", category: "Nước tẩy trang", price: 129000, oldPrice: 169000, origin: "Pháp", volume: "400ml", skinType: "Mọi loại da", benefits: ["Làm sạch sâu bụi bẩn và trang điểm", "Không chứa cồn, không hương liệu", "Dịu nhẹ cho da"], ingredients: "Aqua, Hexylene Glycol, Glycerin, Poloxamer 184, Disodium EDTA.", usage: "Thấm ướt bông tẩy trang, lau nhẹ toàn mặt và vùng mắt." },
  { name: "Nước tẩy trang L'Oreal 3-in-1", brand: "L'Oreal", category: "Nước tẩy trang", price: 179000, oldPrice: 229000, origin: "Pháp", volume: "400ml", skinType: "Da hỗn hợp", benefits: ["Tẩy trang, làm sạch và cấp ẩm", "Loại bỏ makeup lâu trôi", "Không nhờn rít"], ingredients: "Aqua, Hexylene Glycol, Glycerin, Rose Extract.", usage: "Lắc đều, thấm vào bông tẩy trang và lau nhẹ khắp mặt.", flags: { newArrival: true } },
  { name: "Toner Some By Mi AHA-BHA-PHA 30 Days", brand: "Some By Mi", category: "Toner", price: 320000, oldPrice: 390000, origin: "Hàn Quốc", volume: "150ml", skinType: "Da mụn, da dầu", benefits: ["Tẩy tế bào chết dịu nhẹ", "Giảm mụn ẩn, mụn đầu đen", "Se khít lỗ chân lông"], ingredients: "AHA, BHA, PHA, Niacinamide, Tea Tree Extract, Centella Asiatica.", usage: "Sau khi rửa mặt, thấm toner ra bông và lau nhẹ toàn mặt.", flags: { bestSeller: true } },
  { name: "Toner Klairs Supple Preparation", brand: "Klairs", category: "Toner", price: 380000, oldPrice: 450000, origin: "Hàn Quốc", volume: "180ml", skinType: "Da nhạy cảm", benefits: ["Cân bằng pH", "Cấp ẩm sâu", "Làm dịu da tức thì"], ingredients: "Aqua, Butylene Glycol, Hyaluronic Acid, Beta-Glucan, chiết xuất bơ.", usage: "Nhỏ vài giọt vào lòng bàn tay và vỗ nhẹ lên toàn mặt." },
  { name: "Toner Mamonde Rose Water", brand: "Mamonde", category: "Toner", price: 295000, oldPrice: 359000, origin: "Hàn Quốc", volume: "250ml", skinType: "Da khô, thiếu ẩm", benefits: ["Chiết xuất 90% nước hoa hồng Damask", "Cấp ẩm dịu nhẹ", "Hương thơm thư giãn"], ingredients: "Rosa Damascena Flower Water 90%, Butylene Glycol, Glycerin.", usage: "Sử dụng sau bước làm sạch, có thể dùng như xịt khoáng.", flags: { newArrival: true } },
  { name: "Mặt nạ Mediheal N.M.F Aquaring", brand: "Mediheal", category: "Mặt nạ", price: 45000, oldPrice: 65000, origin: "Hàn Quốc", volume: "27ml", skinType: "Da khô", benefits: ["Cấp ẩm tức thì", "Làm dịu da", "Chất liệu tencel mỏng nhẹ"], ingredients: "N.M.F, Hyaluronic Acid, Trehalose, chiết xuất tảo biển.", usage: "Đắp lên mặt sạch trong 15-20 phút, tháo mask và vỗ nhẹ tinh chất còn lại.", flags: { flashSale: true } },
  { name: "Mặt nạ Innisfree My Real Squeeze", brand: "Innisfree", category: "Mặt nạ", price: 25000, oldPrice: 35000, origin: "Hàn Quốc", volume: "20ml", skinType: "Mọi loại da", benefits: ["Chiết xuất tự nhiên", "Nhiều lựa chọn công dụng", "Giá cả phải chăng"], ingredients: "Aqua, chiết xuất thiên nhiên (thay đổi theo loại), Butylene Glycol.", usage: "Đắp lên mặt trong 10-20 phút, tháo mask và massage phần tinh chất." },
  { name: "Mặt nạ đất sét Innisfree Volcanic", brand: "Innisfree", category: "Mặt nạ", price: 210000, oldPrice: 270000, origin: "Hàn Quốc", volume: "100ml", skinType: "Da dầu, da mụn", benefits: ["Hút sạch bã nhờn", "Se khít lỗ chân lông", "Đất sét núi lửa Jeju"], ingredients: "Kaolin, Bentonite, Jeju Volcanic Ash, Glycerin.", usage: "Thoa lớp mỏng lên vùng T, để khô 10 phút và rửa sạch bằng nước ấm." },
  { name: "Serum Paula's Choice 2% BHA", brand: "Paula's Choice", category: "Serum", price: 590000, oldPrice: 720000, origin: "Mỹ", volume: "118ml", skinType: "Da dầu, da mụn", benefits: ["Tẩy tế bào chết sâu bên trong lỗ chân lông", "Giảm mụn đầu đen", "Se khít lỗ chân lông"], ingredients: "Salicylic Acid 2%, Butylene Glycol, chiết xuất trà xanh.", usage: "Dùng buổi tối, thấm ra bông và lau nhẹ. Kết hợp kem chống nắng ban ngày.", flags: { bestSeller: true } },
  { name: "Kem dưỡng CeraVe Moisturizing", brand: "CeraVe", category: "Kem dưỡng", price: 320000, oldPrice: 399000, origin: "Mỹ", volume: "340g", skinType: "Da khô, da nhạy cảm", benefits: ["Phục hồi hàng rào bảo vệ da", "Chứa 3 Ceramides thiết yếu", "Cấp ẩm 24 giờ"], ingredients: "Aqua, Glycerin, Ceramide NP, AP, EOP, Hyaluronic Acid, Cholesterol.", usage: "Thoa lên mặt và cơ thể sau khi tắm hoặc rửa mặt." },
  { name: "Son môi Dior Addict Lip Glow", brand: "Dior", category: "Son môi", price: 890000, oldPrice: 1050000, origin: "Pháp", volume: "3.5g", skinType: "Mọi loại môi", benefits: ["Dưỡng ẩm và nuôi dưỡng môi", "Tăng cường sắc hồng tự nhiên", "Hương thơm nhẹ nhàng"], ingredients: "Ricinus Communis Seed Oil, Beeswax, Shea Butter, Vitamin E.", usage: "Thoa trực tiếp lên môi, dùng như son dưỡng hàng ngày.", flags: { newArrival: true } },
];

export const PRODUCTS: Product[] = RAW.map((r, i) => {
  const gallery = pickImages(i + 1);
  const stock = 20 + Math.floor(seeded(i + 1) * 80);
  const rating = Math.round((4 + seeded(i + 7) * 1) * 10) / 10;
  const reviewCount = 40 + Math.floor(seeded(i + 13) * 460);
  const slug = r.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return {
    id: `sp-${String(i + 1).padStart(3, "0")}`,
    slug,
    name: r.name,
    brand: r.brand,
    category: r.category,
    price: r.price,
    oldPrice: r.oldPrice,
    image: gallery[0],
    images: gallery.slice(1),
    description: `${r.name} là sản phẩm ${r.category.toLowerCase()} đến từ thương hiệu ${r.brand} nổi tiếng. Công thức được nghiên cứu kỹ lưỡng, phù hợp với ${r.skinType.toLowerCase()}, mang lại hiệu quả rõ rệt sau thời gian sử dụng. Sản phẩm chính hãng, cam kết chất lượng và an toàn cho làn da của bạn.`,
    ingredients: r.ingredients,
    benefits: r.benefits,
    usage: r.usage,
    skinType: r.skinType,
    origin: r.origin,
    volume: r.volume,
    manufactureDate: "01/2025",
    expiration: "36 tháng kể từ ngày sản xuất",
    stock,
    rating,
    reviewCount,
    specifications: [
      { label: "Thương hiệu", value: r.brand },
      { label: "Danh mục", value: r.category },
      { label: "Xuất xứ", value: r.origin },
      { label: "Dung tích/Khối lượng", value: r.volume },
      { label: "Loại da phù hợp", value: r.skinType },
      { label: "Ngày sản xuất", value: "01/2025" },
      { label: "Hạn sử dụng", value: "36 tháng kể từ NSX" },
      { label: "Xuất xứ thương hiệu", value: r.origin },
    ],
    ...r.flags,
  };
});

export const getProduct = (id: string) => PRODUCTS.find((p) => p.id === id);

export const productHref = (p: { slug: string; id: string | number }) =>
  `/san-pham/${p.slug}-${p.id}.html`;

/**
 * Extract slug + id from a URL segment like "kem-chong-nang-12.html".
 * Returns null when it does not match the expected shape.
 */
export function parseSanPhamSlug(splat: string): { slug: string; id: string } | null {
  if (!splat) return null;
  const cleaned = splat.replace(/\.html$/i, "");
  const match = cleaned.match(/^(.*)-(\d+)$/);
  if (!match) return null;
  const [, slug, id] = match;
  if (!slug || !id) return null;
  return { slug, id };
}
