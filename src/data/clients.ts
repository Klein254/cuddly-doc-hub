export interface Client {
  id: string;
  name: string;
  description?: string;
}

// EDIT THIS ARRAY TO ADD OR REMOVE CLIENTS
// This file is designed to be easily editable after launch.
export const clientsData: Client[] = [
  {
    id: "aga-khan-hospital",
    name: "Aga Khan University Hospital, Nairobi",
    description: "Provided top-tier facility management and clinical infrastructure support to ensure seamless hospital operations and compliance."
  },
  {
    id: "bliss-healthcare",
    name: "Bliss Healthcare",
    description: "Delivered comprehensive maintenance solutions and high-quality technical supplies across their healthcare network."
  }
];
