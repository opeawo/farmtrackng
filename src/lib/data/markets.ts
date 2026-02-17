export interface NigerianState {
	name: string;
	lgas: string[];
	majorMarkets: string[];
}

export const nigerianStates: NigerianState[] = [
	{
		name: 'Lagos',
		lgas: ['Agege', 'Alimosho', 'Badagry', 'Epe', 'Eti-Osa', 'Ibeju-Lekki', 'Ikeja', 'Ikorodu', 'Kosofe', 'Lagos Island', 'Mushin', 'Ojo', 'Oshodi-Isolo', 'Surulere'],
		majorMarkets: ['Mile 12 Market', 'Agege Market', 'Ojo Market', 'Epe Fish Market']
	},
	{
		name: 'Kano',
		lgas: ['Dala', 'Fagge', 'Gwale', 'Kano Municipal', 'Nassarawa', 'Tarauni', 'Ungogo', 'Wudil'],
		majorMarkets: ['Dawanau Market', 'Sabon Gari Market', 'Kano Livestock Market']
	},
	{
		name: 'Oyo',
		lgas: ['Ibadan North', 'Ibadan South-East', 'Ibadan South-West', 'Ibadan North-East', 'Ibadan North-West', 'Ogbomoso North', 'Ogbomoso South', 'Oyo East', 'Oyo West'],
		majorMarkets: ['Bodija Market', 'Akinyele Cattle Market', 'Oyo Town Market']
	},
	{
		name: 'Rivers',
		lgas: ['Port Harcourt', 'Obio-Akpor', 'Eleme', 'Oyigbo', 'Okrika'],
		majorMarkets: ['Mile 1 Market', 'Choba Market', 'Trans Amadi Market']
	},
	{
		name: 'Kaduna',
		lgas: ['Kaduna North', 'Kaduna South', 'Chikun', 'Igabi', 'Zaria'],
		majorMarkets: ['Kaduna Central Market', 'Zaria Cattle Market', 'Kawo Market']
	},
	{
		name: 'Borno',
		lgas: ['Maiduguri', 'Jere', 'Konduga', 'Bama', 'Gwoza'],
		majorMarkets: ['Monday Market', 'Maiduguri Livestock Market', 'Custom Market']
	},
	{
		name: 'Sokoto',
		lgas: ['Sokoto North', 'Sokoto South', 'Wamako', 'Bodinga', 'Wurno'],
		majorMarkets: ['Sokoto Central Market', 'Illela Border Market']
	},
	{
		name: 'Plateau',
		lgas: ['Jos North', 'Jos South', 'Jos East', 'Barkin Ladi', 'Bassa'],
		majorMarkets: ['Terminus Market', 'Bukuru Market', 'Mangu Market']
	},
	{
		name: 'Adamawa',
		lgas: ['Yola North', 'Yola South', 'Girei', 'Mubi North', 'Mubi South'],
		majorMarkets: ['Jimeta Market', 'Mubi Cattle Market', 'Yola Market']
	},
	{
		name: 'Abuja FCT',
		lgas: ['Abuja Municipal', 'Bwari', 'Gwagwalada', 'Kuje', 'Kwali', 'Abaji'],
		majorMarkets: ['Karu Market', 'Gwagwalada Market', 'Wuse Market']
	}
];

export function getStateByName(name: string): NigerianState | undefined {
	return nigerianStates.find((s) => s.name === name);
}

export function getAllMarkets(): { market: string; state: string }[] {
	return nigerianStates.flatMap((s) =>
		s.majorMarkets.map((market) => ({ market, state: s.name }))
	);
}
