/**
 * 密码强度评估(纯函数,注册页实时提示用)。
 *
 * <p>规则对标主流站点三档制(弱/中/强):
 * ①长度不足 6 一律弱(不满足最低要求);
 * ②强:长度 ≥10 且 ≥3 类字符,或长度 ≥12 且 ≥2 类;
 * ③中:长度 ≥8 且 ≥2 类,或长度 6-7 但 ≥3 类;
 * ④其余为弱。字符类别:小写/大写/数字/符号。</p>
 *
 * @author Moba
 */

/** 强度等级:0 弱 / 1 中 / 2 强 */
export type StrengthLevel = 0 | 1 | 2;

/**
 * 评估密码强度。
 *
 * @param password 密码明文(仅用于即时评估,不存储不传输)
 * @returns 强度等级:0 弱 / 1 中 / 2 强
 */
export function assessPasswordStrength(password: string): StrengthLevel {
  const len = password.length;
  if (len < 6) {
    // 不满足最低长度要求,一律弱
    return 0;
  }
  // 字符类别命中数:小写/大写/数字/符号
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z0-9]/].filter((re) => re.test(password)).length;
  if ((len >= 10 && kinds >= 3) || (len >= 12 && kinds >= 2)) {
    // 长且杂 → 强
    return 2;
  }
  if ((len >= 8 && kinds >= 2) || kinds >= 3) {
    // 长度达标两类以上,或短但杂 → 中
    return 1;
  }
  return 0;
}
