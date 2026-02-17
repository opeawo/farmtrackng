export interface Disease {
	id: string;
	name: string;
	livestockTypes: string[];
	symptoms: string[];
	severity: 'low' | 'medium' | 'high' | 'critical';
	description: string;
	firstAid: string;
}

export const diseases: Disease[] = [
	{
		id: 'fmd',
		name: 'Foot and Mouth Disease',
		livestockTypes: ['cattle', 'goat', 'sheep', 'pig'],
		symptoms: ['blisters on mouth', 'blisters on feet', 'drooling', 'lameness', 'fever', 'not eating'],
		severity: 'critical',
		description: 'Highly contagious viral disease affecting cloven-hoofed animals.',
		firstAid: 'Isolate affected animals immediately. Contact veterinary services. Do not move animals.'
	},
	{
		id: 'ppr',
		name: 'Peste des Petits Ruminants (PPR)',
		livestockTypes: ['goat', 'sheep'],
		symptoms: ['fever', 'nasal discharge', 'mouth sores', 'diarrhea', 'pneumonia', 'not eating'],
		severity: 'critical',
		description: 'Highly contagious viral disease of small ruminants with high mortality.',
		firstAid: 'Isolate sick animals. Provide clean water and shade. Seek veterinary help urgently.'
	},
	{
		id: 'newcastle',
		name: 'Newcastle Disease',
		livestockTypes: ['chicken'],
		symptoms: ['twisting neck', 'green diarrhea', 'breathing difficulty', 'drop in eggs', 'sudden death'],
		severity: 'critical',
		description: 'Highly contagious viral disease of poultry. Can kill entire flocks.',
		firstAid: 'Isolate sick birds. Vaccinate healthy birds if not already done. Burn dead birds.'
	},
	{
		id: 'trypanosomiasis',
		name: 'Trypanosomiasis',
		livestockTypes: ['cattle'],
		symptoms: ['weight loss', 'anemia', 'fever', 'swollen lymph nodes', 'weakness'],
		severity: 'high',
		description: 'Parasitic disease transmitted by tsetse flies. Common in humid zones.',
		firstAid: 'Seek veterinary treatment. Diminazene aceturate or isometamidium chloride may be prescribed.'
	},
	{
		id: 'asf',
		name: 'African Swine Fever',
		livestockTypes: ['pig'],
		symptoms: ['high fever', 'red skin blotches', 'vomiting', 'diarrhea', 'sudden death'],
		severity: 'critical',
		description: 'Highly contagious viral disease of pigs with near 100% mortality. No vaccine available.',
		firstAid: 'Isolate immediately. Report to authorities. Do not move pigs. No treatment available.'
	},
	{
		id: 'lumpy_skin',
		name: 'Lumpy Skin Disease',
		livestockTypes: ['cattle'],
		symptoms: ['skin nodules', 'fever', 'swollen lymph nodes', 'reduced milk', 'weight loss'],
		severity: 'high',
		description: 'Viral disease causing skin lumps and economic losses.',
		firstAid: 'Isolate affected animals. Apply wound care to nodules. Seek veterinary advice.'
	},
	{
		id: 'coccidiosis',
		name: 'Coccidiosis',
		livestockTypes: ['chicken', 'goat'],
		symptoms: ['bloody diarrhea', 'weight loss', 'ruffled feathers', 'weakness', 'dehydration'],
		severity: 'medium',
		description: 'Parasitic disease of the intestines, common in young animals.',
		firstAid: 'Treat with anticoccidial drugs. Improve sanitation. Keep bedding dry.'
	},
	{
		id: 'helminthiasis',
		name: 'Helminthiasis (Worms)',
		livestockTypes: ['cattle', 'goat', 'sheep'],
		symptoms: ['weight loss', 'diarrhea', 'rough coat', 'pot belly', 'anemia', 'weakness'],
		severity: 'medium',
		description: 'Internal parasitic worm infestation. Very common in free-ranging animals.',
		firstAid: 'Deworm with appropriate anthelmintic. Rotate pastures. Improve sanitation.'
	}
];

export function matchSymptoms(
	symptoms: string[],
	livestockType: string
): { disease: Disease; matchCount: number }[] {
	const lowerSymptoms = symptoms.map((s) => s.toLowerCase());

	return diseases
		.filter((d) => d.livestockTypes.includes(livestockType))
		.map((disease) => {
			const matchCount = disease.symptoms.filter((ds) =>
				lowerSymptoms.some((s) => ds.includes(s) || s.includes(ds))
			).length;
			return { disease, matchCount };
		})
		.filter((r) => r.matchCount > 0)
		.sort((a, b) => b.matchCount - a.matchCount);
}
