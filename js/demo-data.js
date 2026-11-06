// 演示数据：未配置 Supabase 时自动使用。正式上线后会被 Supabase 云端数据替代。
// 图片为氛围示意图（Unsplash），正式使用请在后台换成门店真实实拍。
window.MANHEJU_DEMO_DB = {
  stores: [
    { id:"s1", highlights:["微公交直达地铁站","多路公交门口有站","古田商圈·近凯德西城","临长丰大道主干道","生活配套成熟","独门独户","可短租·押一付一"], name:"硚口长安路", slug:"qiaokou-changan", starting_price:1150, address:"武汉市硚口区长安路附近", summary:"生活配套成熟，精装独立公寓，通勤和日常生活都方便。", transit_name:"微公交接驳常码头站（3号线）", transit_distance:"多路公交可达", landmark:"古田商圈 · 凯德西城", sort_order:1, is_active:true, cover_url:"https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80&auto=format&fit=crop" },
    { id:"s2", highlights:["楼下就是商场","生活气息足","骑行10分钟到常码头地铁站","近1号线古田四路站","古田四路主干道旁","独门独户·拎包入住","可短租·押一付一"], name:"硚口天地", slug:"qiaokou-tiandi", starting_price:1000, address:"武汉市硚口区古田四路288号", summary:"独立卫浴与完整生活功能，适合一个人轻松入住。", transit_name:"常码头站（3号线）· 古田四路站（1号线）", transit_distance:"骑行约10分钟", landmark:"楼下商场 · 古田四路", sort_order:2, is_active:true, cover_url:"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80&auto=format&fit=crop" },
    { id:"s3", highlights:["地铁口约100米","1号线·21号线双线换乘","新荣天街上盖·下楼逛商场","300+品牌·吃喝玩乐齐全","多路公交直达","近堤角公园","独门独户·可短租"], name:"后湖新荣 · 地铁100米", slug:"xinrong-metro", starting_price:1300, address:"新荣站地铁口约100米", summary:"离地铁近，减少通勤时间，周边生活和商业配套便利。", transit_name:"新荣站（1号线·21号线换乘）", transit_distance:"步行约100米", landmark:"新荣天街 · 堤角公园", sort_order:3, is_active:true, cover_url:"https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80&auto=format&fit=crop" },
    { id:"s4", highlights:["1号线竹叶海站","天桥直达宜家荟聚","宜家家居下楼即达","荟聚300+品牌·影院超市齐全","紧邻三环线·自驾方便","近竹叶海公园","独门独户·拎包入住"], name:"竹叶海宜家荟聚", slug:"zhuyehai-ikea", starting_price:1000, address:"竹叶海宜家荟聚商圈附近", summary:"靠近大型商圈，吃饭、购物和休闲选择丰富。", transit_name:"竹叶海站（1号线）", transit_distance:"天桥直达商场", landmark:"宜家家居 · 荟聚中心", sort_order:4, is_active:true, cover_url:"https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80&auto=format&fit=crop" },
    { id:"s5", highlights:["近1号线汉西一路站","一站到宗关·换乘3号线","12号线双墩站辐射","汉西建材市场旁","解放大道20余条公交","云鹤小区门口·烟火气足","独门独户·押一付一"], name:"汉西三路云鹤小区门口", slug:"hanxi-third-road", starting_price:1250, address:"武汉市硚口区汉西三路96号（云鹤小区门口）", summary:"成熟社区旁的精装公寓，居住安静，日常配套齐全。", transit_name:"地铁1号线汉西一路站", transit_distance:"步行可达", landmark:"汉西建材市场 · 云鹤小区", sort_order:5, is_active:true, cover_url:"https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&q=80&auto=format&fit=crop" },
    { id:"s6", highlights:["11号线光谷四路站","可换乘光谷空轨","高新大道·名企聚集","近武汉大悦城","光谷中央生态大走廊旁","近西苑公园·鸡公山公园","独门独户·独立厨卫"], name:"光谷东店", slug:"guanggu-dong", starting_price:1400, address:"武汉市光谷东片区，近地铁11号线光谷四路站", summary:"光谷东精装公寓，独门独户，独立厨卫，拎包入住。", transit_name:"地铁11号线光谷四路站", transit_distance:"步行可达", landmark:"武汉大悦城 · 光谷中央生态大走廊", sort_order:6, is_active:true, cover_url:"https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&q=80&auto=format&fit=crop" }
  ],
  roomTypes: [
    { id:"t1", store_id:"s1", name:"精装单间", summary:"独立卫浴，家具家电齐全，一个人住刚刚好。", highlights:["独立卫浴","家具家电齐全","拎包入住"], cover_url:"https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80&auto=format&fit=crop", sort_order:1, is_active:true },
    { id:"t2", store_id:"s1", name:"大开间", summary:"空间更宽敞，可分区休息与办公。", highlights:["空间宽敞","采光好"], cover_url:"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80&auto=format&fit=crop", sort_order:2, is_active:true },
    { id:"t3", store_id:"s2", name:"精装单间", summary:"独立卫浴与完整生活功能，适合一个人轻松入住。", highlights:["独立卫浴","拎包入住"], cover_url:"https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80&auto=format&fit=crop", sort_order:1, is_active:true },
    { id:"t4", store_id:"s3", name:"地铁口单间", summary:"出门就是地铁，通勤省时。", highlights:["地铁100米","独立卫浴"], cover_url:"https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80&auto=format&fit=crop", sort_order:1, is_active:true },
    { id:"t5", store_id:"s5", name:"精装单间", summary:"成熟社区旁，安静宜居。", highlights:["安静","配套齐全"], cover_url:"https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&q=80&auto=format&fit=crop", sort_order:1, is_active:true },
    { id:"t6", store_id:"s6", name:"一房一厅", summary:"40–50㎡，独门独户，独立厨卫，洗衣机冰箱配齐。", highlights:["独门独户","独立厨卫","洗衣机冰箱齐全"], cover_url:"https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&q=80&auto=format&fit=crop", sort_order:1, is_active:true }
  ],
  roomMedia: [
    { id:"m1", room_type_id:"t1", media_type:"image", media_url:"https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80&auto=format&fit=crop", sort_order:1 },
    { id:"m2", room_type_id:"t1", media_type:"image", media_url:"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80&auto=format&fit=crop", sort_order:2 },
    { id:"m3", room_type_id:"t6", media_type:"image", media_url:"https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&q=80&auto=format&fit=crop", sort_order:1 },
    { id:"m4", room_type_id:"t6", media_type:"image", media_url:"https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&q=80&auto=format&fit=crop", sort_order:2 }
  ],
  availableRooms: [
    { id:"r1", store_id:"s1", room_type_id:"t1", type_label:"单间", room_number:"207", rent:1250, management_fee:150, status:"available", public_note:"样板间", sort_order:1, is_public:true },
    { id:"r2", store_id:"s1", room_type_id:"t1", type_label:"单间", room_number:"310", rent:1150, management_fee:150, status:"available", public_note:"", sort_order:2, is_public:true },
    { id:"r3", store_id:"s1", room_type_id:"t2", type_label:"大开间", room_number:"403", rent:1450, management_fee:150, status:"available", public_note:"采光好", sort_order:3, is_public:true },
    { id:"r4", store_id:"s1", room_type_id:"t1", type_label:"单间", room_number:"208", rent:1200, management_fee:150, status:"rented", public_note:"", sort_order:4, is_public:true },
    { id:"r5", store_id:"s6", room_type_id:"t6", type_label:"一房一厅", room_number:"368", rent:1500, management_fee:150, status:"available", public_note:"独门独户", sort_order:1, is_public:true },
    { id:"r6", store_id:"s3", room_type_id:"t4", type_label:"单间", room_number:"519", rent:1300, management_fee:150, status:"available", public_note:"近地铁", sort_order:1, is_public:true }
  ],
  priceSheets: []
};
