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

function parseKey(meta: PropMeta, data: any): any {
    const { constr: cls, key } = meta;

    console.log('parseKey', key, cls, data)

    if (cls === String) {
        return String(data);

    } else if (cls === Number) {
        return Number(data);

    } else if (cls === Object) {
        return { ...data };

    } else {
        return parse(cls as Class<any>, data);
    }
}

function parse<T>(cls: Class<T>, data: any): T | undefined {
    const schema = meta.get(cls);

    if (schema) {
        const obj = new cls();
        const ancestors = getAncestors(cls);
        const processed: Record<string, boolean> = {};

        const process = (prop_meta: PropMeta, key: string) => {
            if (!processed[key]) {
                if (
                    data &&
                    data[key] !== undefined &&
                    data[key] !== null
                ) {
                    (obj as any)[key] = parseKey(prop_meta, data[key]);
                    processed[key] = true;
                }
            }
        }

        schema.forEach(process);
        ancestors.forEach(ancestor => {
            const a_schema = meta.get(ancestor);

            if (a_schema) {
                a_schema.forEach(process);
            }
        });

        return obj;
    } else {
        return undefined;
    }
}

function setMeta(target: Object, key: string | symbol, type?: Function) {
    const t = type || Reflect.getMetadata("design:type", target, key);

    if (!meta.has(target.constructor)) {
        meta.set(target.constructor, new Map<string, PropMeta>());
    }

    key = String(key);

    meta.get(target.constructor)?.set(key, {
        constr: t,
        key: key,
    });
}

const Json = (type?: Function): PropertyDecorator => {
    return (target, key): void => {
        setMeta(target, key, type);
    };
}

const JsonObject = (type: Function): PropertyDecorator => {
    return (target, key): void => {
        setMeta(target, key, type);
    };
}

const JsonArray = (type: Function): PropertyDecorator => {
    return (target, key): void => {
        setMeta(target, key, Array);
    };
}

class User {
    @Json()
    name?: string;

    @Json()
    surname?: string;

    x = '1';
}

class Geo {
    @Json()
    x: number = 0;

    @Json()
    y: number = 0;
}

class Me extends User {
    @Json()
    name: string = '';

    @Json()
    ggg?: number;

    @Json()
    pos?: Set<string>;

    @JsonArray(Geo)
    geo?: Geo | number = 1;

    @Json()
    map?: Record<number, string>;
}

const u = new User();

console.log(parse(Me, { name: '', surname: 55, geo: {  } }))
console.log(meta);
