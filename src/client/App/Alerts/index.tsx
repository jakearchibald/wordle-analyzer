import { h, Component, RenderableProps, Fragment } from 'preact';
import * as styles from './styles.module.css';
import 'add-css:./styles.module.css';
import { animateFrom, animateTo } from 'client/utils';

interface TypedEventTarget<EventMap> {
  dispatchEvent(event: EventMap[keyof EventMap]): boolean;
  addEventListener<K extends keyof EventMap>(
    type: K,
    listener: (this: TypedEventTarget<EventMap>, ev: EventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener<K extends keyof EventMap>(
    type: K,
    listener: (this: TypedEventTarget<EventMap>, ev: EventMap[K]) => any,
    options?: boolean | EventListenerOptions,
  ): void;
}

class AlertEvent extends Event {
  message: string;

  constructor(message: string) {
    super('alert');
    this.message = message;
  }
}

interface EventMap {
  alert: AlertEvent;
}

const eventTarget = new EventTarget() as TypedEventTarget<EventMap>;

export function alert(message: string) {
  eventTarget.dispatchEvent(new AlertEvent(message));
}

interface Props {}

interface State {
  messages: string[];
}

export default class Alerts extends Component<Props, State> {
  state: Readonly<State> = {
    messages: [],
  };

  #fadedOut: boolean[] = [];
  #messageEls: HTMLElement[] = [];

  #onMessage = ({ message }: AlertEvent) => {
    this.#fadedOut.push(false);

    this.setState((state) => ({
      messages: [...state.messages, message],
    }));
  };

  #messageElRef = async (el: HTMLElement | null) => {
    if (!el || this.#messageEls.includes(el)) return;
    const index = this.#messageEls.length;
    this.#messageEls.push(el);

    animateFrom(
      el,
      {
        opacity: 0,
        transform: 'scale(1.3)',
      },
      {
        duration: 70,
        easing: 'linear',
      },
    );

    await animateTo(
      el,
      { opacity: 0 },
      { duration: 500, delay: 3000, easing: 'ease' },
    ).finished;

    this.#fadedOut[index] = true;

    if (this.#fadedOut.every((faded) => faded)) {
      this.#fadedOut = [];
      this.#messageEls = [];

      this.setState({
        messages: [],
      });
    }
  };

  componentDidMount() {
    eventTarget.addEventListener('alert', this.#onMessage);
  }

  componentWillUnmount() {
    eventTarget.removeEventListener('alert', this.#onMessage);
  }

  render({}: RenderableProps<Props>, { messages }: State) {
    return (
      <div class={styles.alerts}>
        {messages.map((message, i) => (
          <div
            class={styles.alert}
            role="alert"
            key={message + i}
            ref={this.#messageElRef}
          >
            {message}
          </div>
        ))}
      </div>
    );
  }
}
