class Medication {
  final int id;
  final int? userId;
  final String name;
  final String? dosage;
  final String? frequency;
  final List<String> times;
  final String? instructions;
  final String? doctorName;
  final String? prescribedAt;
  final bool isActive;

  const Medication({
    required this.id,
    this.userId,
    required this.name,
    this.dosage,
    this.frequency,
    this.times = const [],
    this.instructions,
    this.doctorName,
    this.prescribedAt,
    this.isActive = true,
  });

  factory Medication.fromJson(Map<String, dynamic> json) {
    // Backend đã parse `times` thành array, nhưng phòng khi là chuỗi JSON.
    final rawTimes = json['times'];
    final times = rawTimes is List
        ? rawTimes.map((e) => e.toString()).toList()
        : <String>[];

    return Medication(
      id: (json['id'] as num).toInt(),
      userId: (json['user_id'] as num?)?.toInt(),
      name: json['name'] as String? ?? '',
      dosage: json['dosage'] as String?,
      frequency: json['frequency'] as String?,
      times: times,
      instructions: json['instructions'] as String?,
      doctorName: json['doctor_name'] as String?,
      prescribedAt: json['prescribed_at'] as String?,
      isActive: (json['is_active'] as num?)?.toInt() != 0,
    );
  }
}
