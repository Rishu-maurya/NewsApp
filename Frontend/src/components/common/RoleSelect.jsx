import { ROLE_OPTIONS } from '../../data/roles';

export default function RoleSelect({ value, onChange }) {
    const current = ROLE_OPTIONS.find((r) => r.value === value);

    return (
        <div className="field">
            <label htmlFor="role">
                Account type <span className="label-optional">(optional)</span>
            </label>
            <div className="field__control">
                <select
                    id="role"
                    name="role"
                    value={value}
                    onChange={onChange}
                    aria-describedby="role-hint"
                >
                    {ROLE_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value}>
                            {r.label}{r.isDefault ? ' (default)' : ''}
                        </option>
                    ))}
                </select>
            </div>
            <p className="field__hint" id="role-hint">{current?.description}</p>
        </div>
    );
}