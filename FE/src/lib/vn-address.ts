// Simplified mock Vietnamese administrative data
export type Ward = { name: string };
export type District = { name: string; wards: string[] };
export type Province = { name: string; districts: District[] };

export const PROVINCES: Province[] = [
  {
    name: "TP. Hồ Chí Minh",
    districts: [
      { name: "Quận 1", wards: ["Phường Bến Nghé", "Phường Bến Thành", "Phường Đa Kao", "Phường Nguyễn Thái Bình"] },
      { name: "Quận 3", wards: ["Phường Võ Thị Sáu", "Phường 09", "Phường 10", "Phường 11"] },
      { name: "Quận 7", wards: ["Phường Tân Phong", "Phường Tân Phú", "Phường Tân Thuận Đông", "Phường Phú Mỹ"] },
      { name: "Quận Bình Thạnh", wards: ["Phường 12", "Phường 13", "Phường 22", "Phường 25"] },
      { name: "TP. Thủ Đức", wards: ["Phường Thảo Điền", "Phường An Phú", "Phường Linh Trung", "Phường Hiệp Bình Chánh"] },
    ],
  },
  {
    name: "TP. Hà Nội",
    districts: [
      { name: "Quận Hoàn Kiếm", wards: ["Phường Hàng Bạc", "Phường Hàng Bồ", "Phường Hàng Đào", "Phường Tràng Tiền"] },
      { name: "Quận Ba Đình", wards: ["Phường Điện Biên", "Phường Kim Mã", "Phường Ngọc Hà", "Phường Cống Vị"] },
      { name: "Quận Cầu Giấy", wards: ["Phường Dịch Vọng", "Phường Mai Dịch", "Phường Nghĩa Tân", "Phường Quan Hoa"] },
      { name: "Quận Đống Đa", wards: ["Phường Cát Linh", "Phường Láng Hạ", "Phường Ô Chợ Dừa", "Phường Kim Liên"] },
    ],
  },
  {
    name: "TP. Đà Nẵng",
    districts: [
      { name: "Quận Hải Châu", wards: ["Phường Hải Châu I", "Phường Thạch Thang", "Phường Nam Dương", "Phường Bình Hiên"] },
      { name: "Quận Thanh Khê", wards: ["Phường Thanh Khê Đông", "Phường Xuân Hà", "Phường An Khê", "Phường Hòa Khê"] },
      { name: "Quận Sơn Trà", wards: ["Phường An Hải Bắc", "Phường Mân Thái", "Phường Thọ Quang", "Phường Nại Hiên Đông"] },
    ],
  },
  {
    name: "Tỉnh Bình Dương",
    districts: [
      { name: "TP. Thủ Dầu Một", wards: ["Phường Phú Cường", "Phường Phú Hòa", "Phường Chánh Nghĩa", "Phường Hiệp Thành"] },
      { name: "TP. Dĩ An", wards: ["Phường Dĩ An", "Phường Tân Bình", "Phường Tân Đông Hiệp", "Phường Đông Hòa"] },
    ],
  },
  {
    name: "Tỉnh Đồng Nai",
    districts: [
      { name: "TP. Biên Hòa", wards: ["Phường Trung Dũng", "Phường Thanh Bình", "Phường Hòa Bình", "Phường Quang Vinh"] },
      { name: "Huyện Long Thành", wards: ["Thị trấn Long Thành", "Xã An Phước", "Xã Tam An", "Xã Long Đức"] },
    ],
  },
];
