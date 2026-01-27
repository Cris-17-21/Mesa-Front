import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const MyPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '{zinc.50}',
            100: '{zinc.100}',
            200: '{zinc.200}',
            300: '{zinc.300}',
            400: '{zinc.400}',
            500: '{zinc.500}',
            600: '{zinc.600}',
            700: '{zinc.700}',
            800: '{zinc.800}',
            900: '{zinc.900}',
            950: '{zinc.950}'
        }
    },
    components: {
        button: {
            // Si quieres cambiar el color base del botón para que no sea verde:
            root: {
                primary: {
                    background: '{zinc.950}',
                    color: '{zinc.50}',
                    borderColor: '{zinc.800}',
                    hoverBackground: '{zinc.900}',
                    hoverColor: '{zinc.50}'
                }
            }
        },
        table: {
            root: {
                borderColor: '{zinc.800}'
            },
            header: {
                background: '{zinc.50}',
                color: '{zinc.50}'
            },
            row: {
                background: '{zinc.950}',
                color: '{zinc.300}',
                focusBackground: '{zinc.900}'
            }
        }
    }
});