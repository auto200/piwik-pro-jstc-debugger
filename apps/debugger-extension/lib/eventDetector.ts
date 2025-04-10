import { QueryParam } from './types';
type BrokenEvent = 'Broken Event';
type PingType =
  | 'HeartBeat'
  | 'Deanonymization'
  | 'Page performance metric'
  | 'Custom'
  | BrokenEvent;
type EventType =
  | 'Goal Conversion'
  | 'Ping'
  | 'Download'
  | 'Outlink'
  | 'Consent form impression'
  | 'Consent form click'
  | 'Consent decision'
  | 'SharePoint'
  | 'Custom event'
  | 'Content interaction'
  | 'Content impression'
  | 'Cart update'
  | 'Product detail view'
  | 'Add to cart'
  | 'Remove from cart'
  | 'Order completed'
  | 'Internal search'
  | 'Page view'
  | PingType
  | BrokenEvent;
/**
 * https://help.piwik.pro/support/questions/what-are-events-and-how-are-they-detected/
 */
export function getEventType(eventParams: QueryParam[]): EventType {
  if (isBrokenEvent(eventParams)) return 'Broken Event';

  if (isGoalConversion(eventParams)) return 'Goal Conversion';

  if (isPing(eventParams)) return 'Ping';

  if (isDownload(eventParams)) return 'Download';

  if (isOutlink(eventParams)) return 'Outlink';

  if (isConsentFormImpression(eventParams)) return 'Consent form impression';

  if (isConsentFormClick(eventParams)) return 'Consent form click';

  if (isConsentDecision(eventParams)) return 'Consent decision';

  if (isSharePoint(eventParams)) return 'SharePoint';

  if (isCustomEvent(eventParams)) return 'Custom event';

  if (isContentInteraction(eventParams)) return 'Content interaction';

  if (isContentImpression(eventParams)) return 'Content impression';

  if (isCartUpdate(eventParams)) return 'Cart update';

  if (isProductDetailView(eventParams)) return 'Product detail view';

  if (isAddToCart(eventParams)) return 'Add to cart';

  if (isRemoveFromCart(eventParams)) return 'Remove from cart';

  if (isOrderCompleted(eventParams)) return 'Order completed';

  if (isInternalSearch(eventParams)) return 'Internal search';

  return 'Page view';
}

export function getPingType(eventParams: QueryParam[]) {
  const param = eventParams.find((p) => p.name === 'ping');
  if (!param) return 'Broken Event';

  const pingLevel = Number.parseInt(param.value);

  if (pingLevel === 1) return 'Periodic heartbeat';
  if (pingLevel === 2) return 'Last heartbeat';
  if (pingLevel === 3) return 'Blur heartbeat ';

  if (pingLevel === 4) return 'Deanonymization';

  if (pingLevel === 5) return 'Page performance metric';

  if (pingLevel === 6) return 'Custom';

  return 'Broken Event';
}

function isBrokenEvent(eventParams: QueryParam[]) {
  // TODO: validate if idsite and idgoal are in the proper format
  return !eventParams.some((p) => p.name === 'idsite');
}

function isGoalConversion(eventParams: QueryParam[]) {
  const idgoal = eventParams.find((p) => p.name === 'idgoal');
  return idgoal?.value && idgoal.value !== '0';
}

function isPing(eventParams: QueryParam[]) {
  return eventParams.some((p) => p.name === 'ping');
}

function isDownload(eventParams: QueryParam[]) {
  return eventParams.some((p) => p.name === 'download');
}

function isOutlink(eventParams: QueryParam[]) {
  return eventParams.some((p) => p.name === 'link');
}

function isConsentFormImpression(eventParams: QueryParam[]) {
  const category = eventParams.find((p) => p.name === 'e_c');
  return category?.value === 'consent_form_impression';
}

function isConsentFormClick(eventParams: QueryParam[]) {
  const category = eventParams.find((p) => p.name === 'e_c');
  return category?.value === 'consent_form_click';
}

function isConsentDecision(eventParams: QueryParam[]) {
  const category = eventParams.find((p) => p.name === 'e_c');
  return category?.value === 'consent_decision';
}

function isSharePoint(eventParams: QueryParam[]) {
  const eventCustomVariables = eventParams.find((p) => p.name === 'cvar');
  const sessionCustomVariables = eventParams.find((p) => p.name === '_cvar');
  const category = eventParams.find((p) => p.name === 'e_c');

  let parsedEventCustomVariables;
  let parsedSessionCustomVariables;

  try {
    if (eventCustomVariables) {
      parsedEventCustomVariables = JSON.parse(decodeURIComponent(eventCustomVariables.value));
    }
  } catch (e) {
    console.error('Error parsing event custom variables:', e);
    return false;
  }

  try {
    if (sessionCustomVariables) {
      parsedSessionCustomVariables = JSON.parse(decodeURIComponent(sessionCustomVariables.value));
    }
  } catch (e) {
    console.error('Error parsing session custom variables:', e);
    return false;
  }

  return (
    (parsedEventCustomVariables?.['1']?.[0] === 'ppas.sharepoint.plugin' ||
      parsedSessionCustomVariables?.['1']?.[0] === 'ppas.sharepoint.plugin') &&
    (category?.value === 'download' || category?.value === 'search')
  );
}

function isCustomEvent(eventParams: QueryParam[]) {
  const category = eventParams.some((p) => p.name === 'e_c');
  const action = eventParams.some((p) => p.name === 'e_a');
  return category && action;
}

function isContentInteraction(eventParams: QueryParam[]) {
  const interaction = eventParams.some((p) => p.name === 'c_i');
  const name = eventParams.some((p) => p.name === 'c_n');
  return interaction && name;
}

function isContentImpression(eventParams: QueryParam[]) {
  return eventParams.some((p) => p.name === 'c_n');
}

function isCartUpdate(eventParams: QueryParam[]) {
  const idGoal = eventParams.find((p) => p.name === 'idgoal');
  const ecIdPresent = eventParams.some((p) => p.name === 'ec_id');
  const eventType = eventParams.find((p) => p.name === 'e_t');

  return (idGoal?.value === '0' && !ecIdPresent) || eventType?.value === 'cart-update';
}

function isProductDetailView(eventParams: QueryParam[]) {
  return eventParams.find((p) => p.name === 'e_t')?.value === 'product-detail-view';
}

function isAddToCart(eventParams: QueryParam[]) {
  return eventParams.find((p) => p.name === 'e_t')?.value === 'add-to-cart';
}

function isRemoveFromCart(eventParams: QueryParam[]) {
  return eventParams.find((p) => p.name === 'e_t')?.value === 'remove-from-cart';
}

function isOrderCompleted(eventParams: QueryParam[]) {
  const idGoal = eventParams.find((p) => p.name === 'idgoal');
  const ecIdPresent = eventParams.some((p) => p.name === 'ec_id');
  const eventType = eventParams.find((p) => p.name === 'e_t');

  return (idGoal?.value === '0' && ecIdPresent) || eventType?.value === 'order';
}

function isInternalSearch(eventParams: QueryParam[]) {
  return eventParams.some((p) => p.name === 'search');
}
