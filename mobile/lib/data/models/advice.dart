class Advice {
  final int id;
  final String category;
  final String title;
  final String content;
  final int sortOrder;
  final bool isActive;

  const Advice({
    required this.id,
    required this.category,
    required this.title,
    required this.content,
    this.sortOrder = 0,
    this.isActive = true,
  });

  factory Advice.fromJson(Map<String, dynamic> json) => Advice(
        id: (json['id'] as num).toInt(),
        category: json['category'] as String? ?? 'general',
        title: json['title'] as String? ?? '',
        content: json['content'] as String? ?? '',
        sortOrder: (json['sort_order'] as num?)?.toInt() ?? 0,
        isActive: (json['is_active'] as num?)?.toInt() != 0,
      );
}
