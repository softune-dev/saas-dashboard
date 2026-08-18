export type DomainStatus = "Connected" | "Pending" | "Failed";

export type DomainRecord = {
  id: string;
  host: string;
  primary: boolean;
  status: DomainStatus;
  ssl: boolean;
};

export const initialDomains: DomainRecord[] = [
  {
    id: "1",
    host: "modhubon.com",
    primary: true,
    status: "Connected",
    ssl: true,
  },
  {
    id: "2",
    host: "www.modhubon.com",
    primary: false,
    status: "Connected",
    ssl: true,
  },
  {
    id: "3",
    host: "shop.modhubon.com",
    primary: false,
    status: "Pending",
    ssl: false,
  },
];
