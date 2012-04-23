/*******************************************************************************
 * Copyright 2012 David Rusk
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); 
 * you may not use this file except in compliance with the License. 
 * You may obtain a copy of the License at 
 *
 *    http://www.apache.org/licenses/LICENSE-2.0 
 *     
 * Unless required by applicable law or agreed to in writing, software 
 * distributed under the License is distributed on an "AS IS" BASIS, 
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. 
 * See the License for the specific language governing permissions and 
 * limitations under the License.  
 *******************************************************************************/
package org.thechiselgroup.biomixer.server.workbench.util.json;

import java.util.List;

import org.thechiselgroup.biomixer.shared.workbench.util.json.AbstractJsonArray;
import org.thechiselgroup.biomixer.shared.workbench.util.json.JsonItem;

public class JavaJsonArray extends AbstractJsonArray {

    private List<Object> items;

    public JavaJsonArray(List<Object> items) {
        this.items = items;
    }

    @Override
    public JsonItem get(int index) {
        return new JavaJsonItem(items.get(index));
    }

    @Override
    public int size() {
        return items.size();
    }

}
