import 'reflect-metadata';

interface PropMeta {
    constr: Function,
    key: string,
}

type Class<T> = {
    new(...args: any[]): T;
};

const meta = new Map<Function, Map<string, PropMeta>>();
const ancestors_map = new Map<Function, Function[]>()

function getAncestors(target: Function): Function[] {
    if (!ancestors_map.has(target)) {
        const ancestors: Function[] = [];
        for (
            let baseClass = Object.getPrototypeOf(target.prototype.constructor);
            typeof baseClass.prototype !== 'undefined';
            baseClass = Object.getPrototypeOf(baseClass.prototype.constructor)
        ) {
            ancestors.push(baseClass);
        }
        ancestors_map.set(target, ancestors);
    }
    return ancestors_map.get(target) || [];
}

function parseKey<T>(key: string, cls: Function, data: any): T | undefined {
    data = data || {};
    
    if (cls === String) {
        return (data as any)[key];

    } else if (cls === Number) {
        return (data as any)[key];

    } else if (cls === Object) {
        return (data as any)[key];

    } else {
        return parse(cls as Class<any>, data[key]);
    }
}

function parse<T>(cls: Class<T>, data: unknown): T | undefined {
    const schema = meta.get(cls);

    if (schema) {
        const obj = new cls();
        const ancestors = getAncestors(cls);
        const processed: Record<string, boolean> = {};

        schema.forEach((prop, key) => {
            (obj as any)[key] = parseKey(key, prop.constr, data);
            processed[key] = true;
        });
        ancestors.forEach(ancestor => {
            const a_schema = meta.get(ancestor);

            if (a_schema) {
                a_schema.forEach((a_prop, a_key) => {
                    if (!processed[a_key]) {
                        (obj as any)[a_key] = parseKey(a_key, a_prop.constr, data);
                        processed[a_key] = true;
                    }
                });
            }
        });

        return obj;
    } else {
        return undefined;
    }
}

const Prop = (): PropertyDecorator => {
    return (target, key): void => {
        const t = Reflect.getMetadata("design:type", target, key);

        console.log(key, t)

        if (!meta.has(target.constructor)) {
            meta.set(target.constructor, new Map<string, PropMeta>());
        }
        if (typeof key !== 'symbol') {
            meta.get(target.constructor)?.set(key, {
                constr: t,
                key: key,
            });
        }
    };
}

class User {
    @Prop()
    name?: string;

    @Prop()
    surname?: string;

    x = '1';
}

class Geo {
    @Prop()
    x: number = 0;

    @Prop()
    y: number = 0;
}

class Me extends User {
    @Prop()
    name?: string = undefined;

    @Prop()
    ggg?: number;

    @Prop()
    pos?: Set<string>;

    @Prop()
    geo = {
        x: 0,
        y: 0,
    };

    @Prop()
    g?: Geo;

    @Prop()
    map?: Record<number, string>;
}

const u = new User();

console.log(parse(Me, { name: 'asd', geo: { x: 566 } }))
