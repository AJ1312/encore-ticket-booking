'use client';

import { Download } from 'lucide-react';

export function DownloadTicketButton() { return <button className="ticket-download" onClick={() => window.print()}><Download size={15}/> Download / print</button>; }
