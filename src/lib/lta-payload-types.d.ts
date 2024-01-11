export interface BusStop {
	BusStopCode: string;
	RoadName: string;
	Description: string;
	Latitude: number;
	Longitude: number;
}

export interface BusStopArrival {
	BusStopCode: string;
	Services: {
		ServiceNo: string;
		Operator: 'SBST' | 'SMRT' | 'TTS' | 'GAS';
		NextBus: ArrivalInfo | undefined;
		NextBus2: ArrivalInfo | undefined;
		NextBus3: ArrivalInfo | undefined;
	}[];
}

interface ArrivalInfo {
	OriginCode: string;
	DestinationCode: string;
	EstimatedArrival: string;
	Latitude: string;
	Longitude: string;
	VisitNumber: string;
	Load: 'SEA' | 'SDA' | 'LSD';
	Feature: 'WAB' | undefined;
	Type: 'SD' | 'DD' | 'BD';
}
