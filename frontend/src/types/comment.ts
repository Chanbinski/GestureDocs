export interface Comment {
    id: string;
    text: string;
    range: {
      index: number;
      length: number;
    };
  }