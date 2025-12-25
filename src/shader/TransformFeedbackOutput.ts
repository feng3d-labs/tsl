/**
 * Transform Feedback 输出配置
 */
export interface TransformFeedbackOutput
{
    /**
     * 要捕获的输出变量名列表
     * 例如：['gl_Position', 'v_color']
     */
    outputs: string[];

    /**
     * 工作组大小（默认 64）
     */
    workgroupSize?: number;
}

