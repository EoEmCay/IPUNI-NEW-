class User {
  final int id;
  final String? name;
  final String? email;
  final String? cccd;
  final String? phone;
  final String? diagnosis;
  final String? createdAt;

  const User({
    required this.id,
    this.name,
    this.email,
    this.cccd,
    this.phone,
    this.diagnosis,
    this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: (json['id'] as num).toInt(),
        name: json['name'] as String?,
        email: json['email'] as String?,
        cccd: json['cccd'] as String?,
        phone: json['phone'] as String?,
        diagnosis: json['diagnosis'] as String?,
        createdAt: json['created_at'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'cccd': cccd,
        'phone': phone,
        'diagnosis': diagnosis,
        'created_at': createdAt,
      };

  /// Tên hiển thị, fallback theo dữ liệu có sẵn.
  String get displayName {
    if (name != null && name!.trim().isNotEmpty) return name!;
    if (email != null && email!.isNotEmpty) return email!;
    if (phone != null && phone!.isNotEmpty) return phone!;
    return 'Bệnh nhân';
  }

  String get initials {
    final n = displayName.trim();
    if (n.isEmpty) return 'B';
    final parts = n.split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return (parts[parts.length - 2].substring(0, 1) +
            parts.last.substring(0, 1))
        .toUpperCase();
  }
}
