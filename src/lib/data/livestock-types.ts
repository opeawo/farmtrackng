export interface LivestockType {
	id: string;
	name: string;
	icon: string;
	breeds: string[];
	commonDiseases: string[];
}

export const livestockTypes: LivestockType[] = [
	{
		id: 'cattle',
		name: 'Cattle',
		icon: '🐄',
		breeds: ['White Fulani', 'Red Bororo', 'Sokoto Gudali', 'Muturu', 'Ndama', 'Kuri', 'Wadara', 'Crossbreed'],
		commonDiseases: ['Foot and Mouth', 'Bovine Tuberculosis', 'Brucellosis', 'Trypanosomiasis', 'Lumpy Skin Disease', 'Contagious Bovine Pleuropneumonia']
	},
	{
		id: 'goat',
		name: 'Goat',
		icon: '🐐',
		breeds: ['West African Dwarf', 'Red Sokoto', 'Sahel', 'Kano Brown', 'Borno White', 'Crossbreed'],
		commonDiseases: ['PPR (Peste des Petits Ruminants)', 'Goat Pox', 'Pneumonia', 'Helminthiasis', 'Coccidiosis']
	},
	{
		id: 'sheep',
		name: 'Sheep',
		icon: '🐑',
		breeds: ['West African Dwarf', 'Yankasa', 'Uda', 'Balami', 'Ouda', 'Crossbreed'],
		commonDiseases: ['PPR', 'Sheep Pox', 'Foot Rot', 'Helminthiasis', 'Pneumonia']
	},
	{
		id: 'chicken',
		name: 'Chicken',
		icon: '🐔',
		breeds: ['Local/Indigenous', 'Broiler', 'Layer', 'Noiler', 'Cockerel', 'Crossbreed'],
		commonDiseases: ['Newcastle Disease', 'Avian Influenza', 'Gumboro', 'Coccidiosis', 'Fowl Pox', 'Fowl Typhoid']
	},
	{
		id: 'pig',
		name: 'Pig',
		icon: '🐷',
		breeds: ['Large White', 'Landrace', 'Duroc', 'Local', 'Crossbreed'],
		commonDiseases: ['African Swine Fever', 'Porcine Reproductive and Respiratory Syndrome', 'Swine Erysipelas']
	},
	{
		id: 'fish',
		name: 'Fish',
		icon: '🐟',
		breeds: ['Catfish (Clarias)', 'Tilapia', 'Mackerel', 'Heterobranchus'],
		commonDiseases: ['Columnaris', 'Ich (White Spot)', 'Fin Rot', 'Dropsy']
	}
];

export function getLivestockType(id: string): LivestockType | undefined {
	return livestockTypes.find((t) => t.id === id);
}
