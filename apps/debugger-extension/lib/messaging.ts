import { QueryParam } from './types';

export type Message =
  | {
      type: 'PAQ_ENTRY' | 'PPAS_ENTRY';
      source: 'JSTC_DBG';
      payload: { data: [string, ...unknown[]]; stack: string | undefined };
    }
  | {
      type: 'PAQ_NETWORK_EVENT' | 'PPAS_NETWORK_EVENT';
      source: 'JSTC_DBG';
      payload:
        | { type: 'SINGLE'; url: string; params: QueryParam[] }
        | { type: 'BATCH'; url: string; requestsParams: Array<QueryParam[]> };
    }
  | {
      type: 'JSTC_LOADED_PAQ' | 'JSTC_LOADED_PPAS';
      source: 'JSTC_DBG';
    };

export type InternalMessage = {
  type: 'PAGE_METADATA';
  source: 'JSTC_DBG';
  payload: {
    origin: string;
  };
};
