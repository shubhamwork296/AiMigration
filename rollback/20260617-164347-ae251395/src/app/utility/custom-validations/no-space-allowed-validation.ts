import { Directive, Input } from '@angular/core';

@Directive( {
    selector: '[prevent-keys]',
    host: {
        '(keypress)': 'onKeyUp($event)'
    },
    standalone: false
} )
export class PreventKeyseDirective {
    @Input( 'prevent-keys' ) preventKeys;
    onKeyUp ( $event ) {
        if ( this.preventKeys && this.preventKeys.includes( $event. which ) ) {
            $event.preventDefault();
        }
    }
}