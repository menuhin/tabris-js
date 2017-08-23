import {Color, Image, ToggleButton, ToggleButtonSelectEvent} from 'tabris';

let widget: ToggleButton = new ToggleButton();

// Properties
let alignment: 'center' | 'left' | 'right';
let image: Image;
let checked: boolean;
let text: string;
let textColor: Color;

alignment = widget.alignment;
image = widget.image;
checked = widget.checked;
text = widget.text;
textColor = widget.textColor;

widget.alignment = alignment;
widget.image = image;
widget.checked = checked;
widget.text = text;
widget.textColor = textColor;

// Events
let target: ToggleButton = widget;
let timeStamp: number = 0;
let type: string = 'foo';
let value: boolean = true;

let toggleButtonSelectEvent: ToggleButtonSelectEvent = {target, timeStamp, type, checked};

widget.on({
  select: (event: ToggleButtonSelectEvent) => {},
});
